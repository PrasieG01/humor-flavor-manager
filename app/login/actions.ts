'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  // We need to tell Google where to send the user back to.
  // In development, this is localhost. In production, Vercel will handle it.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?message=Could_Not_Initialize_Google_Auth')
  }

  if (data.url) {
    redirect(data.url) // This actually sends them to the Google login screen
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}