import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// IMPORTANT: Make sure the 3-column code I gave you is saved inside this file!
import FlavorEditor from "@/components/FlavorEditor" 
export default async function Project3Page() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Not logged in → go to login
  if (!user) {
    redirect('/login')
  }

  // 2. Logged in but wrong role → go to unauthorized
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) {
    redirect('/unauthorized')
  }

  return <FlavorEditor />
}