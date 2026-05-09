'use server'
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// --- FLAVOR CRUD ---
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
  // Note: Depending on your DB settings, you might need to delete steps first 
  // if you don't have "Cascade Delete" turned on.
  await supabase.from('humor_flavor_steps').delete().eq('humor_flavor_id', id)
  await supabase.from('humor_flavors').delete().eq('id', id)
  revalidatePath('/')
}

// --- STEP CRUD ---
export async function createStep(flavorId: string, order: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. THE TRICK: Fetch an existing step to "steal" its valid foreign keys
  const { data: referenceStep } = await supabase
    .from('humor_flavor_steps')
    .select('llm_input_type_id, llm_output_type_id, llm_model_id, humor_flavor_step_type_id')
    .not('llm_input_type_id', 'is', null) // Make sure we grab one that actually has the data
    .limit(1)
    .single()

  if (!referenceStep) {
    console.error("Could not find a reference step to copy IDs from.")
    return { error: "Missing reference IDs" }
  }

  // 2. Perform the Insert using the copied IDs
  const { data, error } = await supabase.from('humor_flavor_steps').insert([{ 
    humor_flavor_id: flavorId, 
    order_by: order,
    description: "New Execution Step",
    llm_system_prompt: "You are a helpful assistant.",
    llm_temperature: 0.7,
    created_by_user_id: user?.id,
    
    // Inject the required NOT NULL columns using our reference step
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

// --- THE REORDER LOGIC ---
export async function reorderSteps(stepIds: string[]) {
  const supabase = await createClient()
  // We loop through the IDs in their new order and update the order_by column
  const updates = stepIds.map((id, index) => 
    supabase.from('humor_flavor_steps').update({ order_by: index + 1 }).eq('id', id)
  )
  await Promise.all(updates)
  revalidatePath('/')
}

// In actions/prompt-chains.ts — only do steps 1-3
export async function getTestImageId(): Promise<{ imageId?: string, error?: string, token?: string }> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Not logged in" };

  const token = session.access_token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const presignRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
    method: 'POST', headers, body: JSON.stringify({ contentType: 'image/jpeg' })
  });
  const { presignedUrl, cdnUrl } = await presignRes.json();

  const imageBlob = await (await fetch('https://placehold.co/600x400.jpg')).blob();
  await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: imageBlob });

  const registerRes = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
    method: 'POST', headers, body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
  });
  const { imageId } = await registerRes.json();

  return { imageId, token }; // send token back to client for step 4
}