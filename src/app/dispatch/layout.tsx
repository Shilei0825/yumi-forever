import { requireAuth } from '@/lib/auth'
import { DispatchShell } from './dispatch-shell'

export default async function DispatchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAuth(['dispatcher', 'admin'])

  return (
    <DispatchShell profile={profile}>
      {children}
    </DispatchShell>
  )
}
