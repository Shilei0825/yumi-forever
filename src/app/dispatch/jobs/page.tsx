'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  ClipboardList,
  AlertCircle,
  User,
  Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking, BookingStatus, PaymentStatus } from '@/types'

interface BookingWithCrew extends Omit<Booking, 'service' | 'assigned_crew' | 'payments'> {
  service?: { id: string; name: string; category_id: string }
  dispatch_assignments?: {
    id: string
    crew_member_id: string
    crew_member: { id: string; full_name: string } | null
  }[]
  payments?: { id: string; status: PaymentStatus; amount: number }[]
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'pending_quote', label: 'Pending Quote' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
]

const PAGE_SIZE = 25

export default function DispatchJobsPage() {
  const [bookings, setBookings] = useState<BookingWithCrew[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [zipFilter, setZipFilter] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const supabase = createClient()

  const fetchBookings = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          service:services(id, name, category_id),
          dispatch_assignments(
            id,
            crew_member_id,
            crew_member:profiles!dispatch_assignments_crew_member_id_fkey(id, full_name)
          ),
          payments(id, status, amount)
        `)
        .order('scheduled_date', { ascending: sortAsc })
        .order('scheduled_time', { ascending: true })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (dateFrom) {
        query = query.gte('scheduled_date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('scheduled_date', dateTo)
      }
      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`
        query = query.or(
          `customer_name.ilike.${term},booking_number.ilike.${term}`
        )
      }
      if (zipFilter.trim()) {
        query = query.ilike('address_text', `%${zipFilter.trim()}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching bookings:', error)
      } else {
        const results = (data as BookingWithCrew[]) || []
        if (append) {
          setBookings((prev) => [...prev, ...results])
        } else {
          setBookings(results)
        }
        setHasMore(results.length === PAGE_SIZE)
      }

      setLoading(false)
      setLoadingMore(false)
    },
    [supabase, statusFilter, dateFrom, dateTo, searchQuery, zipFilter, sortAsc]
  )

  useEffect(() => {
    setPage(0)
    fetchBookings(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFrom, dateTo, searchQuery, zipFilter, sortAsc])

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchBookings(nextPage, true)
  }

  function getPaymentLabel(booking: BookingWithCrew): {
    label: string
    color: string
  } {
    const payments = booking.payments || []
    if (payments.length === 0)
      return { label: 'Unpaid', color: 'text-red-600' }
    const paidPayment = payments.find((p) => p.status === 'paid')
    const depositPayment = payments.find((p) => p.status === 'deposit_paid')
    if (paidPayment) return { label: 'Paid', color: 'text-emerald-600' }
    if (depositPayment)
      return { label: 'Deposit Paid', color: 'text-yellow-600' }
    return { label: getStatusLabel(payments[0].status), color: 'text-gray-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Jobs</h2>
          <p className="text-sm text-gray-500">
            Manage and track all bookings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Search Bar (always visible) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by customer name or booking number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter Bar (expandable) */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Date From"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                label="Date To"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              <Input
                label="Zip Code"
                placeholder="e.g. 90210"
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('')
                  setDateFrom('')
                  setDateTo('')
                  setZipFilter('')
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortAsc(!sortAsc)}
              >
                Sort: {sortAsc ? 'Oldest First' : 'Newest First'}
                {sortAsc ? (
                  <ChevronUp className="ml-1 h-3 w-3" />
                ) : (
                  <ChevronDown className="ml-1 h-3 w-3" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Jobs Table (Desktop) / Cards (Mobile) */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">
              No jobs found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Booking #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Date / Time
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Crew
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => {
                  const crewMembers =
                    booking.dispatch_assignments?.filter(
                      (a) => a.crew_member
                    ) || []
                  const payment = getPaymentLabel(booking)

                  return (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dispatch/jobs/${booking.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {booking.booking_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{formatDate(booking.scheduled_date)}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(booking.scheduled_time)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {booking.customer_name}
                        </div>
                        <div className="max-w-[200px] truncate text-xs text-gray-500">
                          {booking.address_text}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {booking.service?.name || '--'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {crewMembers.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Unassigned
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {crewMembers.map((a) => (
                              <span
                                key={a.id}
                                className="text-xs text-gray-700"
                              >
                                {a.crew_member?.full_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(booking.total)}
                        </div>
                        <div className={cn('text-xs', payment.color)}>
                          {payment.label}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {bookings.map((booking) => {
              const crewMembers =
                booking.dispatch_assignments?.filter((a) => a.crew_member) || []
              const payment = getPaymentLabel(booking)

              return (
                <Link key={booking.id} href={`/dispatch/jobs/${booking.id}`}>
                  <Card className="transition-colors hover:border-gray-300">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-600">
                            #{booking.booking_number}
                          </p>
                          <p className="mt-1 font-medium text-gray-900">
                            {booking.service?.name || 'Service'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(booking.scheduled_date)} at{' '}
                          {formatTime(booking.scheduled_time)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {booking.customer_name}
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          {crewMembers.length === 0 ? (
                            <span className="text-xs font-medium text-red-600">
                              Unassigned
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">
                              {crewMembers
                                .map((a) => a.crew_member?.full_name)
                                .join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(booking.total)}
                          </span>
                          <span className={cn('ml-2 text-xs', payment.color)}>
                            {payment.label}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
