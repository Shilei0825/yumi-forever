import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalShell } from './portal-shell'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/portal')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'customer') {
    const roleRedirects: Record<string, string> = {
      admin: '/admin',
      dispatcher: '/dispatch',
      crew: '/crew',
    }
    redirect(roleRedirects[profile.role] || '/login')
  }

  return (
    <PortalShell profile={profile}>
      {children}
    </PortalShell>
  )
}
