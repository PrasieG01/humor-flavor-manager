'use server'
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// --- FETCH DATA (NEW FOR THE LAB) ---
export async function getImages(page: number = 1, limit: number = 20) {
  const supabase = await createClient()
  
  // Calculate the 0-indexed range for Supabase
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('images')
    .select('id, url, image_description, created_datetime_utc', { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: data || [],
    totalCount: count || 0,
    hasMore: count ? to < count - 1 : false
  }
}

export async function getFlavors() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('humor_flavors').select('*')
  if (error) throw new Error(error.message)
  return data
}

export async function duplicateFlavor(flavorId: string) {
  const supabase = await createClient()

  const { data: original, error } = await supabase
    .from('humor_flavors')
    .select('*')
    .eq('id', flavorId)
    .single()

  if (error || !original) return { success: false, error: error?.message }

  const { data: newFlavor, error: insertError } = await supabase
    .from('humor_flavors')
    .insert([{ slug: original.slug + '_COPY', description: original.description }])
    .select()
    .single()

  if (insertError || !newFlavor) return { success: false, error: insertError?.message }

  const { data: steps } = await supabase
    .from('humor_flavor_steps')
    .select('*')
    .eq('humor_flavor_id', flavorId)

  if (steps && steps.length > 0) {
    const copiedSteps = steps.map(({ id, ...step }) => ({
      ...step,
      humor_flavor_id: newFlavor.id,
    }))
    await supabase.from('humor_flavor_steps').insert(copiedSteps)
  }

  revalidatePath('/')
  return { success: true, newFlavor }
}



export async function getStepsForFlavor(flavorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('humor_flavor_steps')
    .select('*')
    .eq('humor_flavor_id', flavorId)
    .order('order_by', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

// --- FLAVOR CRUD (EXISTING) ---
export async function createFlavor(formData: FormData) {
  const supabase = await createClient()
  const slug = formData.get('slug') as string
  
  await supabase.from('humor_flavors').insert([{ 
    slug: slug.toUpperCase(), 
    description: "New custom flavor chain" 
  }])
  
  revalidatePath('/')
}

export async function updateFlavor(id: string, slug: string) {
  const supabase = await createClient()
  await supabase.from('humor_flavors').update({ slug: slug.toUpperCase() }).eq('id', id)
  revalidatePath('/')
}

export async function deleteFlavor(id: string) {
  const supabase = await createClient()
  await supabase.from('humor_flavor_steps').delete().eq('humor_flavor_id', id)
  await supabase.from('humor_flavors').delete().eq('id', id)
  revalidatePath('/')
}

// --- STEP CRUD (EXISTING) ---
export async function createStep(flavorId: string, order: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: referenceStep } = await supabase
    .from('humor_flavor_steps')
    .select('llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id')
    .not('llm_input_type_id', 'is', null) 
    .limit(1)
    .single()

  if (!referenceStep) {
    console.error("Could not find a reference step to copy IDs from.")
    return { error: "Missing reference IDs" }
  }

  const { data, error } = await supabase.from('humor_flavor_steps').insert([{ 
    humor_flavor_id: flavorId, 
    order_by: order,
    description: "New Execution Step",
    llm_system_prompt: "You are a helpful assistant.",
    llm_temperature: 0.7,
    created_by_user_id: user?.id,
    
    llm_input_type_id: referenceStep.llm_input_type_id,
    llm_output_type_id: referenceStep.llm_output_type_id,
    llm_model_id: referenceStep.llm_model_id,
    humor_flavor_step_type_id: referenceStep.humor_flavor_step_type_id
  }]).select()

  if (error) {
    console.error("SUPABASE ERROR:", error.message, error.details)
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateStep(id: string, updates: any) {
  const supabase = await createClient()
  await supabase.from('humor_flavor_steps').update(updates).eq('id', id)
  revalidatePath('/')
}

export async function deleteStep(id: string) {
  const supabase = await createClient()
  await supabase.from('humor_flavor_steps').delete().eq('id', id)
  revalidatePath('/')
}

// --- THE REORDER LOGIC (EXISTING) ---
export async function reorderSteps(stepIds: string[]) {
  const supabase = await createClient()
  const updates = stepIds.map((id, index) => 
    supabase.from('humor_flavor_steps').update({ order_by: index + 1 }).eq('id', id)
  )
  await Promise.all(updates)
  revalidatePath('/')
}