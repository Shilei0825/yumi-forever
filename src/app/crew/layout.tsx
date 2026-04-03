import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Briefcase,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

const crewNavigation = [
  { label: 'Today', href: '/crew', icon: <Briefcase className="h-5 w-5" /> },
  { label: 'Jobs', href: '/crew/jobs', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Pay', href: '/crew/pay', icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Messages', href: '/crew/messages', icon: <MessageCircle className="h-5 w-5" /> },
  { label: 'Profile', href: '/crew/profile', icon: <User className="h-5 w-5" /> },
]

export default async function CrewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/crew-login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/crew-login')
  }

  if (profile.role !== 'crew') {
    const roleRedirects: Record<string, string> = {
      customer: '/portal',
      dispatcher: '/dispatch',
      admin: '/admin',
    }
    redirect(roleRedirects[profile.role] || '/')
  }

  return (
    <DashboardLayout
      navigation={crewNavigation}
      title="Crew Portal"
      userDisplayName={profile.full_name}
      userRole="crew"
    >
      {children}
    </DashboardLayout>
  )
}
