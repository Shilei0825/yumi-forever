'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CreditCard,
  Star,
  Loader2,
  X,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking, Payment } from '@/types'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [payingBalanceId, setPayingBalanceId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchBookings = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('bookings')
      .select(
        '*, service:services(*), payments(*), assigned_crew:dispatch_assignments(*, crew_member:profiles!dispatch_assignments_crew_member_id_fkey(*))'
      )
      .eq('profile_id', user.id)
      .order('scheduled_date', { ascending: false })

    if (!error && data) {
      setBookings(data as unknown as Booking[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const pastStatuses = ['completed', 'canceled', 'canceled_refundable', 'canceled_nonrefundable', 'no_show']
  const today = new Date().toISOString().split('T')[0]

  const upcomingBookings = bookings.filter(
    (b) => !pastStatuses.includes(b.status) && b.scheduled_date >= today
  )

  const pastBookings = bookings.filter((b) =>
    pastStatuses.includes(b.status) || b.scheduled_date < today
  )

  function getPaymentStatus(payments?: Payment[]) {
    if (!payments || payments.length === 0) return 'unpaid'
    const hasPaid = payments.some(
      (p) => p.payment_type === 'full' && p.status === 'paid'
    )
    const hasBalancePaid = payments.some(
      (p) => p.payment_type === 'balance' && p.status === 'paid'
    )
    const hasDeposit = payments.some(
      (p) => p.payment_type === 'deposit' && p.status === 'paid'
    )
    if (hasPaid || hasBalancePaid) return 'paid'
    if (hasDeposit) return 'deposit_paid'
    return 'unpaid'
  }

  function getPaymentBadgeColor(status: string) {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'deposit_paid':
        return 'bg-yellow-100 text-yellow-800'
      case 'unpaid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  async function handleCancel(bookingId: string) {
    setCancelingId(bookingId)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: data.status ?? 'canceled' } : b
          )
        )
      }
    } catch {
      // Error handling silently
    }

    setCancelingId(null)
    setCancelConfirmId(null)
  }

  async function handlePayBalance(booking: Booking) {
    setPayingBalanceId(booking.id)

    try {
      const effectiveTotal = booking.final_price ?? booking.total
      const balanceAmount = effectiveTotal - (booking.deposit_amount || 0)
      const res = await fetch('/api/square/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          payment_type: 'balance',
          amount: balanceAmount,
        }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      // Error handling silently
    }

    setPayingBalanceId(null)
  }

  function renderBookingCard(booking: Booking) {
    const paymentStatus = getPaymentStatus(booking.payments)
    const canCancel = !pastStatuses.includes(booking.status)
    const isUpcoming = !pastStatuses.includes(booking.status)
    const canReview = booking.status === 'completed'
    const serviceSlug = booking.service?.slug

    return (
      <Card key={booking.id}>
        <div className="p-4 sm:p-6">
          {/* Summary row */}
          <div className="flex items-start gap-4">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 sm:flex">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/portal/bookings/${booking.id}`}
                    className="font-semibold text-gray-900 hover:underline"
                  >
                    {booking.service?.name || 'Service'}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-500">
                    #{booking.booking_number}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(booking.status)}>
                    {getStatusLabel(booking.status)}
                  </Badge>
                  <Badge className={getPaymentBadgeColor(paymentStatus)}>
                    {getStatusLabel(paymentStatus)}
                  </Badge>
                  {booking.final_price !== null && booking.final_price !== undefined && booking.final_price !== booking.total ? (
                    <span className="flex items-center gap-1">
                      <Badge className="bg-amber-100 text-amber-800 text-xs">Adjusted</Badge>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(booking.final_price)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(booking.total)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(booking.scheduled_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(booking.scheduled_time)}
                </span>
                {booking.address_text && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate">
                      {booking.address_text}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Confirmation */}
          {cancelConfirmId === booking.id && (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Cancel this booking?
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      This action cannot be undone. Any deposit paid may be
                      subject to cancellation policy.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancelingId === booking.id}
                        onClick={() => handleCancel(booking.id)}
                      >
                        {cancelingId === booking.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          'Yes, Cancel Booking'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelConfirmId(null)}
                      >
                        Keep Booking
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Link href={`/portal/bookings/${booking.id}`}>
              <Button variant="outline" size="sm">
                <ArrowRight className="h-4 w-4" />
                View Details
              </Button>
            </Link>

            {isUpcoming && canCancel && cancelConfirmId !== booking.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelConfirmId(booking.id)
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}

            {paymentStatus === 'deposit_paid' &&
              !pastStatuses.includes(booking.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={payingBalanceId === booking.id}
                  onClick={() => handlePayBalance(booking)}
                >
                  {payingBalanceId === booking.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay Balance
                    </>
                  )}
                </Button>
              )}

            {serviceSlug && (
              <Link href={`/book?service=${serviceSlug}`}>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4" />
                  Rebook
                </Button>
              </Link>
            )}

            {canReview && (
              <Link href="/portal/reviews">
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          My Bookings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage all your service bookings.
        </p>
      </div>

      {/* Tabs: Upcoming and Past */}
      <Tabs defaultValue="upcoming">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="upcoming" className="flex-1">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-900">
                  No upcoming bookings
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  You don&apos;t have any upcoming services scheduled.
                </p>
                <Link href="/book" className="mt-4">
                  <Button size="sm">Book a Service</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => renderBookingCard(booking))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-3 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-900">No past bookings</p>
                <p className="mt-1 text-sm text-gray-500">
                  Your completed and canceled bookings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((booking) => renderBookingCard(booking))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
