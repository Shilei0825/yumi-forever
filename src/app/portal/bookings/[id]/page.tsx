'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  FileText,
  Users,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  DollarSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type { Booking, Payment } from '@/types'

export default function BookingDetailPage() {
  const params = useParams()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelResult, setCancelResult] = useState<{
    success: boolean
    isRefundable?: boolean
    refundableAmount?: number
    reason?: string
  } | null>(null)
  const [payingBalance, setPayingBalance] = useState(false)

  const supabase = createClient()

  const fetchBooking = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(
        '*, service:services(*), payments(*), assigned_crew:dispatch_assignments(*, crew_member:profiles!dispatch_assignments_crew_member_id_fkey(*))'
      )
      .eq('id', bookingId)
      .eq('profile_id', user.id)
      .single()

    if (!error && data) {
      setBooking(data as unknown as Booking)
    }

    setLoading(false)
  }, [supabase, bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

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

  function getDepositPaid(payments?: Payment[]): number {
    if (!payments) return 0
    return payments
      .filter((p) => p.payment_type === 'deposit' && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  function getTotalPaid(payments?: Payment[]): number {
    if (!payments) return 0
    return payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  async function handleCancel() {
    setCanceling(true)
    setCancelResult(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setCancelResult({
          success: true,
          isRefundable: data.isRefundable,
          refundableAmount: data.refundableAmount,
          reason: data.reason,
        })
        setBooking((prev) =>
          prev ? { ...prev, status: 'canceled' as const } : prev
        )
      } else {
        setCancelResult({
          success: false,
          reason: data.error || 'Failed to cancel booking',
        })
      }
    } catch {
      setCancelResult({
        success: false,
        reason: 'An unexpected error occurred',
      })
    }

    setCanceling(false)
    setCancelConfirm(false)
  }

  async function handlePayBalance() {
    if (!booking) return
    setPayingBalance(true)

    try {
      const balanceAmount = booking.total - (booking.deposit_amount || 0)
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

    setPayingBalance(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <Link
          href="/portal/bookings"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-900">Booking not found</p>
            <p className="mt-1 text-sm text-gray-500">
              This booking does not exist or you do not have access.
            </p>
            <Link href="/portal/bookings" className="mt-4">
              <Button size="sm">View All Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const paymentStatus = getPaymentStatus(booking.payments)
  const depositPaid = getDepositPaid(booking.payments)
  const totalPaid = getTotalPaid(booking.payments)
  const effectiveTotal = booking.final_price ?? booking.total
  const isPriceAdjusted = booking.final_price !== null && booking.final_price !== undefined && booking.final_price !== booking.total
  const remainingBalance = effectiveTotal - totalPaid
  const isCanceled = booking.status === 'canceled'
  const isCompleted = booking.status === 'completed'
  const canCancel = !['completed', 'canceled'].includes(booking.status)
  const canPayBalance =
    paymentStatus === 'deposit_paid' && !isCanceled
  const serviceSlug = booking.service?.slug

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Back link */}
      <Link
        href="/portal/bookings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {booking.service?.name || 'Service'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Booking #{booking.booking_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </div>

      {/* Cancellation Result Banner */}
      {cancelResult && (
        <div
          className={cn(
            'rounded-lg border p-4',
            cancelResult.success
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          )}
        >
          <div className="flex items-start gap-3">
            {cancelResult.success ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            )}
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  cancelResult.success ? 'text-green-800' : 'text-red-800'
                )}
              >
                {cancelResult.success
                  ? 'Booking canceled successfully'
                  : 'Cancellation failed'}
              </p>
              {cancelResult.reason && (
                <p
                  className={cn(
                    'mt-1 text-sm',
                    cancelResult.success ? 'text-green-700' : 'text-red-700'
                  )}
                >
                  {cancelResult.reason}
                </p>
              )}
              {cancelResult.success && cancelResult.isRefundable && (
                <p className="mt-1 text-sm text-green-700">
                  Refundable amount:{' '}
                  {formatCurrency(cancelResult.refundableAmount ?? 0)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Date
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">
                      {formatDate(booking.scheduled_date)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Time
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900">
                      {formatTime(booking.scheduled_time)}
                    </p>
                    {booking.estimated_duration > 0 && (
                      <p className="text-xs text-gray-500">
                        Est. {booking.estimated_duration} minutes
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              {booking.address_text && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Service Address
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {booking.address_text}
                    </p>
                    {booking.gate_code && (
                      <p className="mt-1 text-xs text-gray-500">
                        Gate code: {booking.gate_code}
                      </p>
                    )}
                    {booking.parking_instructions && (
                      <p className="mt-1 text-xs text-gray-500">
                        Parking: {booking.parking_instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              {booking.vehicle_info && (
                <div className="flex gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Vehicle
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {booking.vehicle_info}
                    </p>
                  </div>
                </div>
              )}

              {/* Service Notes */}
              {booking.service_notes && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Service Notes
                      </p>
                      <p className="mt-0.5 text-sm text-gray-900">
                        {booking.service_notes}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Crew */}
              {booking.assigned_crew && booking.assigned_crew.length > 0 && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Assigned Crew
                      </p>
                      <div className="mt-1 space-y-1">
                        {booking.assigned_crew.map((a) => (
                          <p key={a.id} className="text-sm text-gray-900">
                            {a.crew_member?.full_name || 'Crew Member'}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cancel Confirmation Card */}
          {cancelConfirm && canCancel && (
            <Card className="border-red-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Are you sure you want to cancel this booking?
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      This action cannot be undone. Any deposit paid may be
                      subject to cancellation policy. Cancellations more than
                      24 hours before the scheduled service are eligible for
                      a full deposit refund.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={canceling}
                        onClick={handleCancel}
                      >
                        {canceling ? (
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
                        onClick={() => setCancelConfirm(false)}
                      >
                        Keep Booking
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Pricing & Actions */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-gray-400" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(booking.subtotal)}
                </span>
              </div>
              {booking.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(booking.tax)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span className="text-gray-900">{isPriceAdjusted ? 'Original Quote' : 'Total'}</span>
                <span className={cn('text-gray-900', isPriceAdjusted && 'text-gray-400 line-through text-sm')}>
                  {formatCurrency(booking.total)}
                </span>
              </div>
              {isPriceAdjusted && (
                <>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-primary">Adjusted Price</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(booking.final_price!)}
                    </span>
                  </div>
                  {booking.adjustment_reason && (
                    <div className="rounded-md bg-amber-50 px-3 py-2">
                      <p className="text-xs text-amber-700">
                        <span className="font-medium">Reason:</span> {booking.adjustment_reason}
                      </p>
                    </div>
                  )}
                </>
              )}

              <Separator />

              {/* Payment breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Payment Status
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Deposit paid</span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(depositPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total paid</span>
                  <span className="font-medium text-green-700">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                {remainingBalance > 0 && !isCanceled && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Remaining balance</span>
                    <span className="font-medium text-amber-700">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                )}
                <Badge
                  className={cn('mt-1', getStatusColor(paymentStatus))}
                >
                  {getStatusLabel(paymentStatus)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pay Remaining Balance */}
              {canPayBalance && remainingBalance > 0 && (
                <Button
                  className="w-full"
                  disabled={payingBalance}
                  onClick={handlePayBalance}
                >
                  {payingBalance ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay Remaining Balance ({formatCurrency(remainingBalance)})
                    </>
                  )}
                </Button>
              )}

              {/* Cancel Booking */}
              {canCancel && !cancelConfirm && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setCancelConfirm(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Booking
                </Button>
              )}

              {/* Rebook This Service */}
              {serviceSlug && (
                <Link href={`/book?service=${serviceSlug}`} className="block">
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="h-4 w-4" />
                    Rebook This Service
                  </Button>
                </Link>
              )}

              {/* Cancellation status message */}
              {isCanceled && !cancelResult && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">
                      This booking has been canceled.
                    </p>
                  </div>
                </div>
              )}

              {/* Completed status message */}
              {isCompleted && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <p className="text-sm text-green-700">
                      This service has been completed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          {booking.payments && booking.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getStatusLabel(payment.payment_type)} &middot;{' '}
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
