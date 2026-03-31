'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  User,
  Clock,
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
import type { Booking } from '@/types'

interface BookingWithCrew extends Omit<Booking, 'service' | 'assigned_crew'> {
  service?: { id: string; name: string; category_id: string }
  dispatch_assignments?: {
    id: string
    crew_member_id: string
    crew_member: { id: string; full_name: string } | null
  }[]
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function DispatchCalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [bookings, setBookings] = useState<BookingWithCrew[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const supabase = createClient()

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const weekEndDate = weekDates[6]

  const weekLabel = `${formatShortDate(weekStart)} - ${formatShortDate(weekEndDate)}`

  async function fetchWeekBookings() {
    setLoading(true)
    const startStr = formatWeekDate(weekStart)
    const endStr = formatWeekDate(weekEndDate)

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
      .gte('scheduled_date', startStr)
      .lte('scheduled_date', endStr)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching week bookings:', error)
    } else {
      setBookings((data as BookingWithCrew[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWeekBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingWithCrew[]> = {}
    for (const b of bookings) {
      if (!map[b.scheduled_date]) {
        map[b.scheduled_date] = []
      }
      map[b.scheduled_date].push(b)
    }
    return map
  }, [bookings])

  const selectedBookings = useMemo(() => {
    return bookingsByDate[selectedDate] || []
  }, [bookingsByDate, selectedDate])

  function goToPreviousWeek() {
    setWeekStart((prev) => addDays(prev, -7))
  }

  function goToNextWeek() {
    setWeekStart((prev) => addDays(prev, 7))
  }

  function goToCurrentWeek() {
    const monday = getMonday(new Date())
    setWeekStart(monday)
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-sm text-gray-500">Weekly schedule overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium text-gray-700">
            {weekLabel}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const dateStr = formatWeekDate(date)
              const dayBookings = bookingsByDate[dateStr] || []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    'flex flex-col rounded-lg border p-2 text-left transition-colors hover:border-gray-400 sm:p-3',
                    isSelected
                      ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                      : 'border-gray-200 bg-white',
                    isToday && !isSelected && 'border-blue-300 bg-blue-50/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      {formatDayName(date)}
                    </span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-0.5 text-lg font-bold',
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        dayBookings.length > 0
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      )}
                    >
                      {dayBookings.length} job{dayBookings.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {/* Mini job list - visible on larger screens */}
                  <div className="mt-1.5 hidden space-y-0.5 lg:block">
                    {dayBookings.slice(0, 3).map((b) => {
                      const crewNames = b.dispatch_assignments
                        ?.filter((a) => a.crew_member)
                        .map((a) => getInitials(a.crew_member!.full_name)) || []

                      return (
                        <div
                          key={b.id}
                          className="flex items-center gap-1 truncate text-[10px] text-gray-600"
                        >
                          <span className="font-medium">
                            {formatTime(b.scheduled_time)}
                          </span>
                          <span className="truncate">
                            {b.service?.name?.split(' ')[0]}
                          </span>
                          {crewNames.length > 0 && (
                            <span className="ml-auto shrink-0 text-indigo-600">
                              {crewNames.join(', ')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-gray-400">
                        +{dayBookings.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <Separator />

          {/* Selected Day Jobs */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {formatDate(selectedDate)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {selectedBookings.length} job{selectedBookings.length !== 1 ? 's' : ''}
              </span>
            </h3>

            {selectedBookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-10 w-10 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">
                    No jobs scheduled for this day
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {selectedBookings.map((booking) => {
                  const crewMembers = booking.dispatch_assignments?.filter(
                    (a) => a.crew_member
                  ) || []

                  return (
                    <Link key={booking.id} href={`/dispatch/jobs/${booking.id}`}>
                      <Card className="transition-colors hover:border-gray-300 hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-gray-100">
                                <span className="text-xs font-bold text-gray-900">
                                  {formatTime(booking.scheduled_time)}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {booking.service?.name || 'Service'}
                                  </span>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {getStatusLabel(booking.status)}
                                  </Badge>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  {booking.customer_name} -- {booking.address_text}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {crewMembers.length === 0 ? (
                                <span className="text-xs font-medium text-red-600">
                                  Unassigned
                                </span>
                              ) : (
                                crewMembers.map((a) => (
                                  <span
                                    key={a.id}
                                    className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                  >
                                    <User className="mr-1 h-3 w-3" />
                                    {a.crew_member?.full_name}
                                  </span>
                                ))
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
        </>
      )}
    </div>
  )
}
