"use client"

import {
  LayoutDashboard,
  Calendar,
  Users,
  HardHat,
  DollarSign,
  CreditCard,
  Wrench,
  Building2,
  Crown,
  Star,
  SlidersHorizontal,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import type { Profile } from '@/types'

const adminNavigation = [
  { label: 'Overview', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Bookings', href: '/admin/bookings', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Customers', href: '/admin/customers', icon: <Users className="h-5 w-5" /> },
  { label: 'Crews', href: '/admin/crews', icon: <HardHat className="h-5 w-5" /> },
  { label: 'Payroll', href: '/admin/payroll', icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Payments', href: '/admin/payments', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Services', href: '/admin/services', icon: <Wrench className="h-5 w-5" /> },
  { label: 'Pricing', href: '/admin/pricing', icon: <SlidersHorizontal className="h-5 w-5" /> },
  { label: 'Commercial', href: '/admin/commercial', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Memberships', href: '/admin/memberships', icon: <Crown className="h-5 w-5" /> },
  { label: 'Reviews', href: '/admin/reviews', icon: <Star className="h-5 w-5" /> },
]

interface AdminShellProps {
  children: React.ReactNode
  profile: Profile
}

export function AdminShell({ children, profile }: AdminShellProps) {
  return (
    <DashboardLayout
      navigation={adminNavigation}
      title="Admin Dashboard"
      userDisplayName={profile.full_name}
      userRole="admin"
    >
      {children}
    </DashboardLayout>
  )
}
