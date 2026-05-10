import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// IMPORTANT: Make sure the 3-column code I gave you is saved inside this file!
import FlavorEditor from "@/components/FlavorEditor" 

export default async function Project3Page() {
  const supabase = await createClient()
  
  // 1. ADMIN GATE (Keep this secure on the server)
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_superadmin, is_matrix_admin').eq('id', user?.id).single()
  
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect('/unauthorized')
  }

  // 2. RENDER THE APP
  // The FlavorEditor component now handles all 3 columns, data fetching, and state!
  return (
    <FlavorEditor />
  )
}