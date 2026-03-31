"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Plus, Search, X } from 'lucide-react'
import type { Booking, BookingStatus, PaymentStatus } from '@/types'

const STATUS_OPTIONS = [
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

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Payment Statuses' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
]

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-800',
  deposit_paid: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  partially_paid: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
}

export default function AdminBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('bookings')
      .select('*, service:services(name), assigned_crew:dispatch_assignments(crew_member_id, crew_member:profiles(full_name))')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (paymentStatusFilter) {
      query = query.eq('payment_status', paymentStatusFilter)
    }
    if (dateFrom) {
      query = query.gte('scheduled_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('scheduled_date', dateTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }, [statusFilter, paymentStatusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Client-side search filter
  const filteredBookings = bookings.filter((booking) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      booking.booking_number.toLowerCase().includes(term) ||
      booking.customer_name.toLowerCase().includes(term) ||
      booking.customer_email.toLowerCase().includes(term)
    )
  })

  function getRemainingBalance(booking: Booking): number {
    const effectiveTotal = booking.final_price ?? booking.total
    const depositPaid = booking.payment_status === 'deposit_paid' || booking.payment_status === 'partially_paid' || booking.payment_status === 'paid'
      ? booking.deposit_amount
      : 0
    if (booking.payment_status === 'paid') return 0
    if (booking.payment_status === 'refunded') return 0
    return Math.max(0, effectiveTotal - depositPaid)
  }

  const hasActiveFilters = statusFilter || paymentStatusFilter || dateFrom || dateTo || search

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all bookings across the platform.
          </p>
        </div>
        <Link href="/book">
          <Button>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or booking #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              options={PAYMENT_STATUS_OPTIONS}
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              label="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              label="To"
            />
          </div>
          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setStatusFilter('')
                  setPaymentStatusFilter('')
                  setDateFrom('')
                  setDateTo('')
                  setSearch('')
                }}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              No bookings found matching your criteria.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Booking #</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Service</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Deposit</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Balance</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => {
                    const remainingBalance = getRemainingBalance(booking)
                    const effectiveTotal = booking.final_price ?? booking.total

                    return (
                      <tr
                        key={booking.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-primary">
                            {booking.booking_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(booking.scheduled_date)}
                          <br />
                          <span className="text-xs">{formatTime(booking.scheduled_time)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{booking.customer_name}</p>
                            <p className="text-xs text-gray-500">{booking.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {(booking.service as any)?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={PAYMENT_STATUS_COLORS[booking.payment_status] || 'bg-gray-100 text-gray-800'}>
                            {getStatusLabel(booking.payment_status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {booking.deposit_amount > 0 ? formatCurrency(booking.deposit_amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={remainingBalance > 0 ? 'font-medium text-red-600' : 'text-green-600'}>
                            {formatCurrency(remainingBalance)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                          {formatCurrency(effectiveTotal)}
                          {booking.final_price !== null && booking.final_price !== booking.total && (
                            <span className="block text-xs text-gray-400 line-through">
                              {formatCurrency(booking.total)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
