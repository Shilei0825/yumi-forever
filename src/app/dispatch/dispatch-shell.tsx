'use client'

import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import type { Profile } from '@/types'

const navigation = [
  { label: 'Dashboard', href: '/dispatch', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Calendar', href: '/dispatch/calendar', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Jobs', href: '/dispatch/jobs', icon: <ClipboardList className="h-5 w-5" /> },
  { label: 'Crews', href: '/dispatch/crews', icon: <Users className="h-5 w-5" /> },
]

interface DispatchShellProps {
  children: React.ReactNode
  profile: Profile
}

export function DispatchShell({ children, profile }: DispatchShellProps) {
  return (
    <DashboardLayout
      navigation={navigation}
      title="Dispatch Center"
      userDisplayName={profile.full_name}
      userRole={profile.role}
    >
      {children}
    </DashboardLayout>
  )
}
