'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle,
  Play,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  cn,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking, BookingStatus } from '@/types'

type BookingWithService = Omit<Booking, 'service'> & {
  service?: {
    id: string
    name: string
    duration_minutes: number
  }
}

export default function CrewTodayPage() {
  const router = useRouter()
  const supabase = createClient()

  const [jobs, setJobs] = useState<BookingWithService[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  const fetchTodayJobs = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserName(profile.full_name.split(' ')[0])
      }

      // Get today's date in local timezone
      const today = new Date().toISOString().split('T')[0]

      // Fetch assignments for today
      const { data: assignments, error } = await supabase
        .from('dispatch_assignments')
        .select('*, booking:bookings(*, service:services(name, id, duration_minutes))')
        .eq('crew_member_id', user.id)

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      // Filter for today's jobs
      const todayJobs = (assignments || [])
        .filter((a) => {
          const booking = a.booking as BookingWithService | null
          return booking && booking.scheduled_date === today
        })
        .map((a) => a.booking as BookingWithService)
        .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))

      setJobs(todayJobs)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTodayJobs()
  }, [fetchTodayJobs])

  async function handleAction(bookingId: string, action: 'start_job' | 'complete_job') {
    setActionLoading(bookingId)
    try {
      const response = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, booking_id: bookingId }),
      })

      if (response.ok) {
        await fetchTodayJobs()
      }
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const completedCount = jobs.filter((j) => j.status === 'completed').length
  const activeStatuses: BookingStatus[] = ['assigned', 'on_the_way', 'in_progress', 'confirmed']

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-20">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {userName || 'there'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{today}</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
              <p className="text-xs text-gray-500">Jobs Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchTodayJobs()}
          disabled={loading}
        >
          <Clock className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">
              No jobs scheduled for today
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Check the Jobs tab for upcoming assignments
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <Link href={`/crew/jobs/${job.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900">
                        {job.service?.name || 'Service'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatTime(job.scheduled_time)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {job.customer_name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{job.address_text}</span>
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-2">
                      <Badge className={cn(getStatusColor(job.status))}>
                        {getStatusLabel(job.status)}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Link>

              {/* Action Buttons */}
              {(job.status === 'assigned' || job.status === 'on_the_way') && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <Button
                    className="h-12 w-full bg-green-600 text-base font-semibold text-white hover:bg-green-700"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAction(job.id, 'start_job')
                    }}
                    disabled={actionLoading === job.id}
                  >
                    {actionLoading === job.id ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-5 w-5" />
                    )}
                    Start Job
                  </Button>
                </div>
              )}
              {job.status === 'in_progress' && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <Button
                    className="h-12 w-full bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAction(job.id, 'complete_job')
                    }}
                    disabled={actionLoading === job.id}
                  >
                    {actionLoading === job.id ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    )}
                    Complete Job
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
