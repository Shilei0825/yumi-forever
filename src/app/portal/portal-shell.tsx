'use client'

import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Crown,
  Star,
  Plus,
  Gift,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import type { Profile } from '@/types'

const navigation = [
  { label: 'Book a Service', href: '/portal/book', icon: <Plus className="h-5 w-5" /> },
  { label: 'Dashboard', href: '/portal', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Bookings', href: '/portal/bookings', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Payments', href: '/portal/payments', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Memberships', href: '/portal/memberships', icon: <Crown className="h-5 w-5" /> },
  { label: 'Reviews', href: '/portal/reviews', icon: <Star className="h-5 w-5" /> },
  { label: 'Credits', href: '/portal/credits', icon: <Gift className="h-5 w-5" /> },
]

interface PortalShellProps {
  children: React.ReactNode
  profile: Profile
}

export function PortalShell({ children, profile }: PortalShellProps) {
  return (
    <DashboardLayout
      navigation={navigation}
      title="Customer Portal"
      userDisplayName={profile.full_name}
      userRole="customer"
    >
      {children}
    </DashboardLayout>
  )
}
