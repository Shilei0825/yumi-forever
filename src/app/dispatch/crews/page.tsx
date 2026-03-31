'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Users,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle2,
  User,
  Briefcase,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatTime,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Profile, Booking } from '@/types'

interface CrewWithAssignments extends Profile {
  dispatch_assignments?: {
    id: string
    booking_id: string
    assigned_at: string
    booking: Booking & {
      service?: { id: string; name: string }
    }
  }[]
}

interface WeekAssignment {
  date: string
  bookings: (Booking & { service?: { id: string; name: string } })[]
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatWeekDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function DispatchCrewsPage() {
  const [crewMembers, setCrewMembers] = useState<CrewWithAssignments[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCrew, setExpandedCrew] = useState<string | null>(null)
  const [showCapacity, setShowCapacity] = useState(false)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const weekStart = getMonday(new Date())
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  async function fetchCrewData() {
    setLoading(true)

    const startStr = formatWeekDate(weekStart)
    const endStr = formatWeekDate(weekDates[6])

    // Fetch all crew members with their assignments for this week
    const { data: crewData, error: crewError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'crew')
      .order('full_name', { ascending: true })

    if (crewError) {
      console.error('Error fetching crew:', crewError)
      setLoading(false)
      return
    }

    // Fetch assignments for all crew members this week
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('dispatch_assignments')
      .select(`
        id,
        crew_member_id,
        booking_id,
        assigned_at,
        booking:bookings(
          *,
          service:services(id, name)
        )
      `)
      .in(
        'crew_member_id',
        (crewData || []).map((c) => c.id)
      )

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
    }

    // Merge assignments into crew data
    const crewWithAssignments: CrewWithAssignments[] = (crewData || []).map(
      (crew) => ({
        ...crew,
        dispatch_assignments: (assignmentsData || [])
          .filter((a) => a.crew_member_id === crew.id)
          .map((a) => ({
            id: a.id,
            booking_id: a.booking_id,
            assigned_at: a.assigned_at,
            booking: a.booking as unknown as Booking & {
              service?: { id: string; name: string }
            },
          })),
      })
    )

    setCrewMembers(crewWithAssignments)
    setLoading(false)
  }

  useEffect(() => {
    fetchCrewData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getTodayJobCount(crew: CrewWithAssignments): number {
    return (
      crew.dispatch_assignments?.filter(
        (a) => a.booking?.scheduled_date === today
      ).length || 0
    )
  }

  function getWeekSchedule(crew: CrewWithAssignments): WeekAssignment[] {
    return weekDates.map((date) => {
      const dateStr = formatWeekDate(date)
      const dayBookings =
        crew.dispatch_assignments
          ?.filter((a) => a.booking?.scheduled_date === dateStr)
          .map((a) => a.booking) || []

      return {
        date: dateStr,
        bookings: dayBookings,
      }
    })
  }

  function getWeekJobCount(crew: CrewWithAssignments, dateStr: string): number {
    return (
      crew.dispatch_assignments?.filter(
        (a) => a.booking?.scheduled_date === dateStr
      ).length || 0
    )
  }

  function getTotalWeekJobs(crew: CrewWithAssignments): number {
    return weekDates.reduce(
      (sum, date) => sum + getWeekJobCount(crew, formatWeekDate(date)),
      0
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crew Management</h2>
          <p className="text-sm text-gray-500">
            {crewMembers.length} crew member{crewMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant={showCapacity ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowCapacity(!showCapacity)}
        >
          <Briefcase className="h-4 w-4" />
          {showCapacity ? 'Hide Capacity' : 'Capacity View'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : crewMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">
              No crew members found
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Capacity View */}
          {showCapacity && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Weekly Capacity Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Crew Member
                        </th>
                        {weekDates.map((date) => (
                          <th
                            key={formatWeekDate(date)}
                            className={cn(
                              'px-3 py-2 text-center font-medium text-gray-600',
                              formatWeekDate(date) === today &&
                                'bg-blue-50 text-blue-700'
                            )}
                          >
                            <div className="text-xs">
                              {date.toLocaleDateString('en-US', {
                                weekday: 'short',
                              })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {date.getDate()}
                            </div>
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-medium text-gray-600">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {crewMembers.map((crew) => (
                        <tr key={crew.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                                {getInitials(crew.full_name)}
                              </div>
                              <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                                {crew.full_name}
                              </span>
                            </div>
                          </td>
                          {weekDates.map((date) => {
                            const dateStr = formatWeekDate(date)
                            const count = getWeekJobCount(crew, dateStr)
                            return (
                              <td
                                key={dateStr}
                                className={cn(
                                  'px-3 py-2 text-center',
                                  dateStr === today && 'bg-blue-50'
                                )}
                              >
                                <span
                                  className={cn(
                                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium',
                                    count === 0
                                      ? 'text-gray-300'
                                      : count <= 2
                                        ? 'bg-green-100 text-green-700'
                                        : count <= 4
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                  )}
                                >
                                  {count}
                                </span>
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-center">
                            <span className="text-sm font-bold text-gray-900">
                              {getTotalWeekJobs(crew)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crew Cards */}
          <div className="space-y-3">
            {crewMembers.map((crew) => {
              const todayJobs = getTodayJobCount(crew)
              const isExpanded = expandedCrew === crew.id
              const weekSchedule = getWeekSchedule(crew)

              return (
                <Card key={crew.id}>
                  <CardContent className="p-0">
                    {/* Crew Header */}
                    <button
                      type="button"
                      className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                      onClick={() =>
                        setExpandedCrew(isExpanded ? null : crew.id)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                          {getInitials(crew.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {crew.full_name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                            {crew.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {crew.phone}
                              </span>
                            )}
                            {crew.email && (
                              <span className="hidden items-center gap-1 sm:flex">
                                <Mail className="h-3 w-3" />
                                {crew.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="success"
                              className="text-[10px]"
                            >
                              Active
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            <span className="font-medium text-gray-900">
                              {todayJobs}
                            </span>{' '}
                            job{todayJobs !== 1 ? 's' : ''} today
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded: Week Schedule */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <h4 className="mb-3 text-sm font-medium text-gray-700">
                          This Week&apos;s Schedule
                        </h4>
                        <div className="space-y-3">
                          {weekSchedule.map((day) => {
                            const isToday = day.date === today
                            return (
                              <div key={day.date}>
                                <div
                                  className={cn(
                                    'mb-1.5 flex items-center gap-2',
                                    isToday && 'text-blue-700'
                                  )}
                                >
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">
                                    {formatShortDate(new Date(day.date + 'T12:00:00'))}
                                  </span>
                                  {isToday && (
                                    <Badge className="bg-blue-100 text-[10px] text-blue-700">
                                      Today
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-400">
                                    ({day.bookings.length} job
                                    {day.bookings.length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                                {day.bookings.length > 0 ? (
                                  <div className="ml-5 space-y-1.5">
                                    {day.bookings.map((booking) => (
                                      <a
                                        key={booking.id}
                                        href={`/dispatch/jobs/${booking.id}`}
                                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 transition-colors hover:border-gray-300"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-900">
                                            {formatTime(
                                              booking.scheduled_time
                                            )}
                                          </span>
                                          <span className="text-xs text-gray-600">
                                            {booking.service?.name ||
                                              'Service'}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            -- {booking.customer_name}
                                          </span>
                                        </div>
                                        <Badge
                                          className={cn(
                                            getStatusColor(booking.status),
                                            'text-[10px]'
                                          )}
                                        >
                                          {getStatusLabel(booking.status)}
                                        </Badge>
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="ml-5 text-xs text-gray-400">
                                    No jobs scheduled
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
