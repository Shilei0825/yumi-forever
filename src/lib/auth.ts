import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Get the current session from the server-side Supabase client.
 * Returns the session or null if no active session exists.
 */
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error fetching session:', error.message)
    return null
  }

  return session
}

/**
 * Get the current user's profile including their role.
 * Returns the profile or null if not authenticated or profile not found.
 */
export async function getProfile() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return profile
}

/**
 * Server-side auth check that redirects if the user is not authenticated
 * or does not have one of the allowed roles.
 *
 * @param allowedRoles - Optional array of roles that are permitted.
 *   If omitted, any authenticated user is allowed.
 * @returns The user's profile if authorized.
 */
export async function requireAuth(allowedRoles?: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(profile.role)) {
      // Redirect user to their correct dashboard
      const roleRedirects: Record<string, string> = {
        customer: '/portal',
        crew: '/crew',
        dispatcher: '/dispatch',
        admin: '/admin',
      }
      redirect(roleRedirects[profile.role] || '/portal')
    }
  }

  return profile
}

/**
 * Sign out the current user and redirect to the homepage.
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
