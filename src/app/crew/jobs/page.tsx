'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Clock,
  MapPin,
  ChevronRight,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  cn,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking } from '@/types'

type BookingWithService = Omit<Booking, 'service'> & {
  service?: {
    id: string
    name: string
    duration_minutes: number
  }
}

export default function CrewJobsPage() {
  const supabase = createClient()

  const [jobs, setJobs] = useState<BookingWithService[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('today')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: assignments, error } = await supabase
        .from('dispatch_assignments')
        .select('*, booking:bookings(*, service:services(name, id, duration_minutes))')
        .eq('crew_member_id', user.id)

      if (error) {
        console.error('Error fetching jobs:', error)
        return
      }

      const allJobs = (assignments || [])
        .filter((a) => a.booking)
        .map((a) => a.booking as BookingWithService)
        .sort((a, b) => {
          const dateCompare = a.scheduled_date.localeCompare(b.scheduled_date)
          if (dateCompare !== 0) return dateCompare
          return a.scheduled_time.localeCompare(b.scheduled_time)
        })

      setJobs(allJobs)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const today = new Date().toISOString().split('T')[0]

  const todayJobs = jobs.filter((j) => j.scheduled_date === today)
  const upcomingJobs = jobs.filter(
    (j) =>
      j.scheduled_date > today &&
      j.status !== 'completed' &&
      j.status !== 'canceled'
  )
  const completedJobs = jobs
    .filter((j) => j.status === 'completed')
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))

  function renderJobCard(job: BookingWithService, showDate = false) {
    return (
      <Link key={job.id} href={`/crew/jobs/${job.id}`}>
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-900">
                  {job.service?.name || 'Service'}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                  {showDate && (
                    <span className="font-medium">
                      {formatDate(job.scheduled_date)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(job.scheduled_time)}
                  </span>
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
        </Card>
      </Link>
    )
  }

  function renderEmptyState(message: string) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Briefcase className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-base font-medium text-gray-500">{message}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <h2 className="text-xl font-bold text-gray-900">My Jobs</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="min-h-[44px] text-sm">
            Today ({todayJobs.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="min-h-[44px] text-sm">
            Upcoming ({upcomingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="min-h-[44px] text-sm">
            Done ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {todayJobs.length === 0 ? (
            renderEmptyState('No jobs scheduled for today')
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => renderJobCard(job))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingJobs.length === 0 ? (
            renderEmptyState('No upcoming jobs')
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => renderJobCard(job, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedJobs.length === 0 ? (
            renderEmptyState('No completed jobs yet')
          ) : (
            <div className="space-y-3">
              {completedJobs.map((job) => renderJobCard(job, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
