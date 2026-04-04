"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  DollarSign,
  Camera,
  Save,
  XCircle,
  RotateCcw,
  Send,
  HardHat,
  FileText,
  Edit3,
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'
import type { Booking, BookingStatus, BookingStatusHistory, Payment, UploadedPhoto, Profile, PaymentStatus } from '@/types'

const BOOKING_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'pending_quote', label: 'Pending Quote' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'on_the_way', label: 'On The Way' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'canceled_refundable', label: 'Canceled (Refundable)' },
  { value: 'canceled_nonrefundable', label: 'Canceled (Non-Refundable)' },
  { value: 'no_show', label: 'No-Show' },
]

const PAYMENT_STATUS_OPTIONS = [
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

export default function AdminBookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [crewMembers, setCrewMembers] = useState<Profile[]>([])
  const [assignedCrew, setAssignedCrew] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAdjustment, setSavingAdjustment] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editable fields
  const [editStatus, setEditStatus] = useState<string>('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [selectedCrewId, setSelectedCrewId] = useState('')

  // Final price adjustment fields
  const [editFinalPrice, setEditFinalPrice] = useState('')
  const [editAdjustmentReason, setEditAdjustmentReason] = useState('')
  const [showPriceAdjustment, setShowPriceAdjustment] = useState(false)

  const fetchBooking = useCallback(async () => {
    const supabase = createClient()

    const [bookingRes, historyRes, paymentsRes, photosRes, crewRes, assignmentsRes] =
      await Promise.all([
        supabase
          .from('bookings')
          .select('*, service:services(*)')
          .eq('id', bookingId)
          .single(),
        supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true }),
        supabase
          .from('payments')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false }),
        supabase
          .from('uploaded_photos')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'crew'),
        supabase
          .from('dispatch_assignments')
          .select('*, crew_member:profiles(id, full_name, phone)')
          .eq('booking_id', bookingId),
      ])

    if (bookingRes.data) {
      setBooking(bookingRes.data)
      setEditStatus(bookingRes.data.status)
      setEditDate(bookingRes.data.scheduled_date)
      setEditTime(bookingRes.data.scheduled_time)
      setEditNotes(bookingRes.data.internal_notes || '')
      // Initialize final price fields from existing data
      if (bookingRes.data.final_price !== null && bookingRes.data.final_price !== undefined) {
        // Convert from cents to dollars for the input field
        setEditFinalPrice((bookingRes.data.final_price / 100).toFixed(2))
      } else {
        setEditFinalPrice('')
      }
      setEditAdjustmentReason(bookingRes.data.adjustment_reason || '')
    }

    setStatusHistory(historyRes.data || [])
    setPayments(paymentsRes.data || [])
    setPhotos(photosRes.data || [])
    setCrewMembers(crewRes.data || [])
    setAssignedCrew(assignmentsRes.data || [])
    setLoading(false)
  }, [bookingId])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  async function handleSave() {
    if (!booking) return
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: editStatus as BookingStatus,
        scheduled_date: editDate,
        scheduled_time: editTime,
        internal_notes: editNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      setMessage({ type: 'error', text: 'Failed to update booking.' })
      setSaving(false)
      return
    }

    // If status changed, add to status history
    if (editStatus !== booking.status) {
      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        status: editStatus,
        changed_by: null,
        notes: `Status changed from ${getStatusLabel(booking.status)} to ${getStatusLabel(editStatus)}`,
      })
    }

    setMessage({ type: 'success', text: 'Booking updated successfully.' })
    await fetchBooking()
    setSaving(false)
  }

  async function handleSavePriceAdjustment() {
    if (!booking) return
    setSavingAdjustment(true)
    setMessage(null)

    const supabase = createClient()

    // Parse the final price from dollars to cents
    const finalPriceDollars = parseFloat(editFinalPrice)
    if (isNaN(finalPriceDollars) || finalPriceDollars < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid price.' })
      setSavingAdjustment(false)
      return
    }

    if (!editAdjustmentReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for the price adjustment.' })
      setSavingAdjustment(false)
      return
    }

    const finalPriceCents = Math.round(finalPriceDollars * 100)

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        final_price: finalPriceCents,
        adjustment_reason: editAdjustmentReason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (updateError) {
      setMessage({ type: 'error', text: 'Failed to save price adjustment.' })
      setSavingAdjustment(false)
      return
    }

    // Add to status history for audit trail
    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      status: booking.status,
      changed_by: null,
      notes: `Final price adjusted to ${formatCurrency(finalPriceCents)} (was ${formatCurrency(booking.total)}). Reason: ${editAdjustmentReason.trim()}`,
    })

    setMessage({ type: 'success', text: 'Price adjustment saved successfully.' })
    setShowPriceAdjustment(false)
    await fetchBooking()
    setSavingAdjustment(false)
  }

  async function handleAssignCrew() {
    if (!booking || !selectedCrewId) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('dispatch_assignments').insert({
      booking_id: booking.id,
      crew_member_id: selectedCrewId,
    })

    if (error) {
      setMessage({ type: 'error', text: 'Failed to assign crew member.' })
    } else {
      setMessage({ type: 'success', text: 'Crew member assigned.' })
      setSelectedCrewId('')
      await fetchBooking()
    }
    setSaving(false)
  }

  async function handleCancel() {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('bookings')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('id', booking.id)

    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      status: 'canceled',
      changed_by: null,
      notes: 'Booking canceled by admin',
    })

    setMessage({ type: 'success', text: 'Booking canceled.' })
    await fetchBooking()
    setSaving(false)
  }

  async function handleNoShow() {
    if (!booking || !confirm('Mark this booking as no-show? This will record a violation against the customer.')) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Marked as no-show by admin' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to mark as no-show')
      }
      setMessage({ type: 'success', text: 'Booking marked as no-show. Violation recorded.' })
      await fetchBooking()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to mark no-show.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Booking not found.</p>
        <Link href="/admin/bookings" className="mt-4 inline-block text-primary hover:underline">
          Back to Bookings
        </Link>
      </div>
    )
  }

  const amountPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const effectiveTotal = booking.final_price ?? booking.total
  const amountDue = Math.max(0, effectiveTotal - amountPaid)
  const depositPaid = payments
    .filter((p) => p.status === 'paid' && p.payment_type === 'deposit')
    .reduce((sum, p) => sum + p.amount, 0)
  const balancePaid = payments
    .filter((p) => p.status === 'paid' && p.payment_type === 'balance')
    .reduce((sum, p) => sum + p.amount, 0)
  const tipsPaid = payments
    .filter((p) => p.status === 'paid' && p.payment_type === 'tip')
    .reduce((sum, p) => sum + p.amount, 0)
  const refundsTotal = payments
    .filter((p) => p.payment_type === 'refund')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/bookings')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Booking {booking.booking_number}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDate(booking.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(booking.status) + ' text-sm px-3 py-1'}>
            {getStatusLabel(booking.status)}
          </Badge>
          <Badge className={(PAYMENT_STATUS_COLORS[booking.payment_status] || 'bg-gray-100 text-gray-800') + ' text-sm px-3 py-1'}>
            {getStatusLabel(booking.payment_status)}
          </Badge>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Service</label>
                  <p className="text-sm text-gray-900">{(booking.service as any)?.name || 'N/A'}</p>
                </div>
                <Select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={BOOKING_STATUSES}
                />
                <Input
                  label="Scheduled Date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <Input
                  label="Scheduled Time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Estimated Duration</label>
                <p className="text-sm text-gray-900">{booking.estimated_duration} minutes</p>
              </div>

              {/* Service-specific info */}
              {booking.vehicle_info && (
                <>
                  <Separator />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Vehicle Information</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-md p-3">{booking.vehicle_info}</p>
                  </div>
                </>
              )}

              <Separator />
              <Textarea
                label="Internal Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add internal notes..."
                rows={3}
              />
              {booking.service_notes && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Customer Notes</label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">{booking.service_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Breakdown
                </CardTitle>
                {!showPriceAdjustment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPriceAdjustment(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Adjust Final Price
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service Base Price</span>
                  <span className="text-gray-900">{formatCurrency(booking.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">{formatCurrency(booking.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-900">Original Total</span>
                  <span className="text-gray-900">{formatCurrency(booking.total)}</span>
                </div>

                {booking.final_price !== null && booking.final_price !== booking.total && (
                  <>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-primary flex items-center gap-1">
                        <Edit3 className="h-3 w-3" />
                        Final Price (Adjusted)
                      </span>
                      <span className="text-primary">{formatCurrency(booking.final_price)}</span>
                    </div>
                    {booking.adjustment_reason && (
                      <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-medium text-blue-800">Adjustment Reason</p>
                        <p className="text-sm text-blue-700 mt-1">{booking.adjustment_reason}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Final Price Adjustment Form */}
              {showPriceAdjustment && (
                <>
                  <Separator />
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">Adjust Final Price</p>
                    </div>
                    <p className="text-xs text-amber-700">
                      This will override the calculated total. The remaining balance will be recalculated automatically.
                    </p>
                    <Input
                      label="Final Price ($)"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`Current: ${(effectiveTotal / 100).toFixed(2)}`}
                      value={editFinalPrice}
                      onChange={(e) => setEditFinalPrice(e.target.value)}
                    />
                    {editFinalPrice && !isNaN(parseFloat(editFinalPrice)) && (
                      <div className="rounded-md bg-white border border-gray-200 p-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">New Final Price</span>
                          <span className="font-medium text-gray-900">{formatCurrency(Math.round(parseFloat(editFinalPrice) * 100))}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Already Paid</span>
                          <span className="text-green-600">{formatCurrency(amountPaid)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-900">Remaining Balance</span>
                          <span className={
                            Math.round(parseFloat(editFinalPrice) * 100) - amountPaid > 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }>
                            {formatCurrency(Math.max(0, Math.round(parseFloat(editFinalPrice) * 100) - amountPaid))}
                          </span>
                        </div>
                      </div>
                    )}
                    <Textarea
                      label="Adjustment Reason (required)"
                      value={editAdjustmentReason}
                      onChange={(e) => setEditAdjustmentReason(e.target.value)}
                      placeholder="e.g., Additional work required, customer discount, scope change..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePriceAdjustment}
                        disabled={savingAdjustment}
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {savingAdjustment ? 'Saving...' : 'Record Adjustment'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPriceAdjustment(false)
                          // Reset to current values
                          if (booking.final_price !== null && booking.final_price !== undefined) {
                            setEditFinalPrice((booking.final_price / 100).toFixed(2))
                          } else {
                            setEditFinalPrice('')
                          }
                          setEditAdjustmentReason(booking.adjustment_reason || '')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{booking.customer_name}</p>
                    <p className="text-xs text-gray-500">Customer Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{booking.customer_email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{booking.customer_phone}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{booking.address_text || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Address</p>
                  </div>
                </div>
              </div>
              {(booking.gate_code || booking.parking_instructions || booking.vehicle_info) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {booking.gate_code && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Gate Code</p>
                        <p className="text-sm text-gray-900">{booking.gate_code}</p>
                      </div>
                    )}
                    {booking.parking_instructions && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Parking</p>
                        <p className="text-sm text-gray-900">{booking.parking_instructions}</p>
                      </div>
                    )}
                    {booking.vehicle_info && (
                      <div>
                        <p className="text-xs font-medium text-gray-500">Vehicle</p>
                        <p className="text-sm text-gray-900">{booking.vehicle_info}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Crew Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crew Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedCrew.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {assignedCrew.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {assignment.crew_member?.full_name || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {assignment.crew_member?.phone || ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-500">No crew assigned yet.</p>
              )}
              <div className="flex items-end gap-3">
                <Select
                  label="Assign Crew Member"
                  value={selectedCrewId}
                  onChange={(e) => setSelectedCrewId(e.target.value)}
                  placeholder="Select crew member..."
                  options={crewMembers
                    .filter((c) => !assignedCrew.some((a: any) => a.crew_member_id === c.id))
                    .map((c) => ({ value: c.id, label: c.full_name }))}
                />
                <Button
                  onClick={handleAssignCrew}
                  disabled={!selectedCrewId || saving}
                  size="sm"
                >
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Photos Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photos ({photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <p className="text-sm text-gray-500">No photos uploaded for this booking.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Booking photo'}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <Badge className="bg-white/20 text-white text-xs">
                          {getStatusLabel(photo.photo_type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No status history recorded.</p>
              ) : (
                <div className="space-y-0">
                  {statusHistory.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                        </div>
                        {index < statusHistory.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(entry.status)}>
                            {getStatusLabel(entry.status)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="mt-1 text-xs text-gray-600">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('Payment link feature coming soon.')}
              >
                <Send className="h-4 w-4" />
                Send Payment Link
              </Button>
              {booking.status !== 'canceled' && booking.status !== 'no_show' && (
                <>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Booking
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={handleNoShow}
                    disabled={saving}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Mark No-Show
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('Refund feature coming soon.')}
              >
                <RotateCcw className="h-4 w-4" />
                Refund
              </Button>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className={(PAYMENT_STATUS_COLORS[booking.payment_status] || 'bg-gray-100 text-gray-800') + ' text-sm'}>
                  {getStatusLabel(booking.payment_status)}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deposit Required</span>
                  <span className="text-gray-900">
                    {booking.deposit_waived
                      ? 'Waived (no prior violations)'
                      : formatCurrency(booking.deposit_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deposit Paid</span>
                  <span className={depositPaid > 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                    {formatCurrency(depositPaid)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(booking.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">{formatCurrency(booking.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Original Total</span>
                <span className={booking.final_price !== null && booking.final_price !== booking.total ? 'text-gray-400 line-through' : 'font-semibold text-gray-900'}>
                  {formatCurrency(booking.total)}
                </span>
              </div>
              {booking.final_price !== null && booking.final_price !== booking.total && (
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-primary">Final Price</span>
                  <span className="text-primary">{formatCurrency(booking.final_price)}</span>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payments Received</p>
                {depositPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deposit</span>
                    <span className="text-green-600">{formatCurrency(depositPaid)}</span>
                  </div>
                )}
                {balancePaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance Payments</span>
                    <span className="text-green-600">{formatCurrency(balancePaid)}</span>
                  </div>
                )}
                {tipsPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tips</span>
                    <span className="text-green-600">{formatCurrency(tipsPaid)}</span>
                  </div>
                )}
                {refundsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Refunds</span>
                    <span className="text-red-600">-{formatCurrency(refundsTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Total Paid</span>
                  <span className="text-green-600">{formatCurrency(amountPaid)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-900">Remaining Balance</span>
                <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(amountDue)}
                </span>
              </div>

              {payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment History</p>
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-700">{getStatusLabel(payment.payment_type)}</span>
                          {(payment as any).payment_method && (payment as any).payment_method !== 'online' && (
                            <span className="ml-1 text-xs text-gray-400">
                              ({(payment as any).payment_method === 'cash' ? 'Cash' : 'Device'})
                            </span>
                          )}
                          <span className="ml-2">
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusLabel(payment.status)}
                            </Badge>
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Scheduled:</span>
                <span className="text-gray-900">
                  {formatDate(booking.scheduled_date)} at {formatTime(booking.scheduled_time)}
                </span>
              </div>
              {booking.started_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Started:</span>
                  <span className="text-gray-900">{formatDate(booking.started_at)}</span>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Completed:</span>
                  <span className="text-gray-900">{formatDate(booking.completed_at)}</span>
                </div>
              )}
              {booking.actual_duration_minutes && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Duration:</span>
                  <span className="text-gray-900">{booking.actual_duration_minutes} min</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
