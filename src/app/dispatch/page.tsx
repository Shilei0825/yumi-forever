'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatCurrency,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'

type FilterType = 'all' | 'unassigned' | 'in_progress' | 'completed'

interface BookingWithCrew extends Omit<Booking, 'service' | 'assigned_crew'> {
  service?: { id: string; name: string; category_id: string }
  dispatch_assignments?: {
    id: string
    crew_member_id: string
    crew_member: { id: string; full_name: string } | null
  }[]
}

export default function DispatchDashboardPage() {
  const [bookings, setBookings] = useState<BookingWithCrew[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  async function fetchTodayBookings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(id, name, category_id),
        dispatch_assignments(
          id,
          crew_member_id,
          crew_member:profiles!dispatch_assignments_crew_member_id_fkey(id, full_name)
        )
      `)
      .eq('scheduled_date', today)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings((data as BookingWithCrew[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTodayBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const total = bookings.length
    const inProgress = bookings.filter(
      (b) => b.status === 'in_progress' || b.status === 'on_the_way'
    ).length
    const completed = bookings.filter((b) => b.status === 'completed').length
    const unassigned = bookings.filter(
      (b) =>
        !b.dispatch_assignments || b.dispatch_assignments.length === 0
    ).length
    return { total, inProgress, completed, unassigned }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    switch (filter) {
      case 'unassigned':
        return bookings.filter(
          (b) =>
            !b.dispatch_assignments || b.dispatch_assignments.length === 0
        )
      case 'in_progress':
        return bookings.filter(
          (b) => b.status === 'in_progress' || b.status === 'on_the_way'
        )
      case 'completed':
        return bookings.filter((b) => b.status === 'completed')
      default:
        return bookings
    }
  }, [bookings, filter])

  const statCards = [
    {
      label: "Today's Jobs",
      value: stats.total,
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Unassigned',
      value: stats.unassigned,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unassigned', label: 'Unassigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispatch Dashboard</h2>
          <p className="text-sm text-gray-500">{todayDisplay}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTodayBookings} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {f.key === 'unassigned' && stats.unassigned > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {stats.unassigned}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Job List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">
              {filter === 'all'
                ? 'No jobs scheduled for today'
                : `No ${filter.replace('_', ' ')} jobs for today`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const crewMembers = booking.dispatch_assignments?.filter(
              (a) => a.crew_member
            ) || []
            const isUnassigned = crewMembers.length === 0

            return (
              <Link key={booking.id} href={`/dispatch/jobs/${booking.id}`}>
                <Card className="transition-colors hover:border-gray-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: Time + Service + Customer */}
                      <div className="flex items-start gap-4">
                        {/* Time */}
                        <div className="flex h-12 w-16 flex-col items-center justify-center rounded-lg bg-gray-100 text-center">
                          <span className="text-sm font-bold text-gray-900">
                            {formatTime(booking.scheduled_time)}
                          </span>
                        </div>
                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {booking.service?.name || 'Service'}
                            </p>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-3">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {booking.customer_name}
                            </span>
                            <span className="hidden sm:inline">|</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{booking.address_text}</span>
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            #{booking.booking_number}
                          </p>
                        </div>
                      </div>

                      {/* Right: Crew Assignment */}
                      <div className="flex items-center gap-2 sm:text-right">
                        {isUnassigned ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Unassigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {crewMembers.map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                              >
                                {a.crew_member?.full_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
