'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Hash,
  Lock,
  Car,
  StickyNote,
  Image as ImageIcon,
  DollarSign,
  UserPlus,
  UserMinus,
  Save,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
} from '@/lib/utils'
import type {
  Booking,
  BookingStatus,
  BookingStatusHistory,
  BookingItem,
  CrewAssignment,
  Payment,
  UploadedPhoto,
  Profile,
} from '@/types'

const ALL_STATUSES: { value: BookingStatus; label: string }[] = [
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

export default function DispatchJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const supabase = createClient()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [addons, setAddons] = useState<BookingItem[]>([])
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([])
  const [assignments, setAssignments] = useState<CrewAssignment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [crewMembers, setCrewMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // State for actions
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedCrewId, setSelectedCrewId] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [assigningCrew, setAssigningCrew] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const fetchBookingData = useCallback(async () => {
    setLoading(true)

    // Fetch booking with service info
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*, service:services(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !bookingData) {
      console.error('Error fetching booking:', bookingError)
      setLoading(false)
      return
    }

    setBooking(bookingData as Booking)
    setSelectedStatus(bookingData.status)
    setInternalNote('')

    // Fetch related data in parallel
    const [
      { data: addonsData },
      { data: historyData },
      { data: assignmentsData },
      { data: paymentsData },
      { data: photosData },
      { data: crewData },
    ] = await Promise.all([
      supabase
        .from('booking_items')
        .select('*')
        .eq('booking_id', bookingId),
      supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true }),
      supabase
        .from('dispatch_assignments')
        .select('*, crew_member:profiles!dispatch_assignments_crew_member_id_fkey(*)')
        .eq('booking_id', bookingId),
      supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false }),
      supabase
        .from('uploaded_photos')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'crew'),
    ])

    setAddons((addonsData as BookingItem[]) || [])
    setStatusHistory((historyData as BookingStatusHistory[]) || [])
    setAssignments((assignmentsData as CrewAssignment[]) || [])
    setPayments((paymentsData as Payment[]) || [])
    setPhotos((photosData as UploadedPhoto[]) || [])
    setCrewMembers((crewData as Profile[]) || [])
    setLoading(false)
  }, [bookingId, supabase])

  useEffect(() => {
    fetchBookingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  async function handleUpdateStatus() {
    if (!booking || !selectedStatus || selectedStatus === booking.status) return
    setUpdatingStatus(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Update booking status
    const updateData: Record<string, string | null> = { status: selectedStatus }
    if (selectedStatus === 'in_progress') {
      updateData.started_at = new Date().toISOString()
    }
    if (selectedStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error updating status:', updateError)
      setUpdatingStatus(false)
      return
    }

    // Insert status history
    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      status: selectedStatus,
      changed_by: user?.id || null,
      notes: `Status changed to ${getStatusLabel(selectedStatus)}`,
    })

    await fetchBookingData()
    setUpdatingStatus(false)
  }

  async function handleAssignCrew() {
    if (!booking || !selectedCrewId) return
    setAssigningCrew(true)

    const { error } = await supabase.from('dispatch_assignments').insert({
      booking_id: booking.id,
      crew_member_id: selectedCrewId,
    })

    if (error) {
      console.error('Error assigning crew:', error)
      setAssigningCrew(false)
      return
    }

    // If booking status is 'confirmed' or 'new', auto-update to 'assigned'
    if (booking.status === 'confirmed' || booking.status === 'new') {
      const { data: { user } } = await supabase.auth.getUser()

      await supabase
        .from('bookings')
        .update({ status: 'assigned' })
        .eq('id', booking.id)

      await supabase.from('booking_status_history').insert({
        booking_id: booking.id,
        status: 'assigned',
        changed_by: user?.id || null,
        notes: 'Crew assigned - status auto-updated',
      })
    }

    setSelectedCrewId('')
    await fetchBookingData()
    setAssigningCrew(false)
  }

  async function handleRemoveCrew(assignmentId: string) {
    const { error } = await supabase
      .from('dispatch_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error removing crew:', error)
      return
    }

    await fetchBookingData()
  }

  async function handleSaveNotes() {
    if (!booking || !internalNote.trim()) return
    setSaving(true)

    const existingNotes = booking.internal_notes || ''
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    const newNotes = existingNotes
      ? `${existingNotes}\n\n[${timestamp}] ${internalNote.trim()}`
      : `[${timestamp}] ${internalNote.trim()}`

    const { error } = await supabase
      .from('bookings')
      .update({ internal_notes: newNotes })
      .eq('id', booking.id)

    if (error) {
      console.error('Error saving notes:', error)
    } else {
      setInternalNote('')
      await fetchBookingData()
    }
    setSaving(false)
  }

  async function handleCancelBooking() {
    if (!booking) return
    setUpdatingStatus(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('bookings')
      .update({ status: 'canceled' })
      .eq('id', booking.id)

    await supabase.from('booking_status_history').insert({
      booking_id: booking.id,
      status: 'canceled',
      changed_by: user?.id || null,
      notes: 'Booking canceled by dispatcher',
    })

    setCancelConfirm(false)
    await fetchBookingData()
    setUpdatingStatus(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm font-medium text-gray-500">Booking not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dispatch/jobs')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  const vehicleInfo = booking.vehicle_info
    ? (() => {
        try {
          return JSON.parse(booking.vehicle_info)
        } catch {
          return null
        }
      })()
    : null

  const assignedCrewIds = assignments.map((a) => a.crew_member_id)
  const availableCrew = crewMembers.filter(
    (c) => !assignedCrewIds.includes(c.id)
  )

  const totalPaid = payments
    .filter((p) => p.status === 'paid' || p.status === 'deposit_paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const remaining = booking.total - totalPaid

  const photosByType = {
    condition: photos.filter((p) => p.photo_type === 'condition'),
    before: photos.filter((p) => p.photo_type === 'before'),
    after: photos.filter((p) => p.photo_type === 'after'),
    other: photos.filter((p) => p.photo_type === 'other'),
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dispatch/jobs')}
          className="mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                #{booking.booking_number}
              </h2>
              <Badge className={cn(getStatusColor(booking.status), 'text-sm')}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDateTime(booking.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4 text-gray-400" />
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">Booking #</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">
                    {booking.booking_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <div className="mt-0.5">
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Scheduled Date
                  </p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {formatDate(booking.scheduled_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Scheduled Time
                  </p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {formatTime(booking.scheduled_time)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Est. Duration
                  </p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    {booking.estimated_duration} min
                  </p>
                </div>
                {booking.started_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Started At
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {formatDateTime(booking.started_at)}
                    </p>
                  </div>
                )}
                {booking.completed_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      Completed At
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {formatDateTime(booking.completed_at)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-gray-400" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.customer_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">
                      {booking.customer_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">
                      {booking.customer_phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">
                      {booking.address_text}
                    </p>
                  </div>
                </div>
                {booking.gate_code && (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Gate Code</p>
                      <p className="text-sm font-mono text-gray-900">
                        {booking.gate_code}
                      </p>
                    </div>
                  </div>
                )}
                {booking.parking_instructions && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <Car className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">
                        Parking Instructions
                      </p>
                      <p className="text-sm text-gray-900">
                        {booking.parking_instructions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-gray-400" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Service</p>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.service?.name || 'Service'}
                  </p>
                  {booking.service?.description && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {booking.service.description}
                    </p>
                  )}
                </div>
                {addons.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Add-ons</p>
                    <ul className="mt-1 space-y-1">
                      {addons.map((addon) => (
                        <li
                          key={addon.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">{addon.name}</span>
                          <span className="text-gray-900">
                            {formatCurrency(addon.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.service_notes && (
                  <div>
                    <p className="text-xs text-gray-500">Service Notes</p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {booking.service_notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle / Property Info */}
          {vehicleInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-gray-400" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {vehicleInfo.year && (
                    <div>
                      <p className="text-xs text-gray-500">Year</p>
                      <p className="text-sm text-gray-900">{vehicleInfo.year}</p>
                    </div>
                  )}
                  {vehicleInfo.make && (
                    <div>
                      <p className="text-xs text-gray-500">Make</p>
                      <p className="text-sm text-gray-900">{vehicleInfo.make}</p>
                    </div>
                  )}
                  {vehicleInfo.model && (
                    <div>
                      <p className="text-xs text-gray-500">Model</p>
                      <p className="text-sm text-gray-900">{vehicleInfo.model}</p>
                    </div>
                  )}
                  {vehicleInfo.color && (
                    <div>
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="text-sm text-gray-900">{vehicleInfo.color}</p>
                    </div>
                  )}
                  {vehicleInfo.type && (
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm text-gray-900">{vehicleInfo.type}</p>
                    </div>
                  )}
                  {vehicleInfo.license_plate && (
                    <div>
                      <p className="text-xs text-gray-500">License Plate</p>
                      <p className="text-sm font-mono text-gray-900">
                        {vehicleInfo.license_plate}
                      </p>
                    </div>
                  )}
                </div>
                {vehicleInfo.condition_notes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Condition Notes</p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {vehicleInfo.condition_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Photos Section */}
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(['condition', 'before', 'after', 'other'] as const).map(
                    (type) => {
                      const typePhotos = photosByType[type]
                      if (typePhotos.length === 0) return null

                      return (
                        <div key={type}>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                            {type} Photos
                          </p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                            {typePhotos.map((photo) => (
                              <a
                                key={photo.id}
                                href={photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || `${type} photo`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                {photo.caption && (
                                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1">
                                    <p className="truncate text-[10px] text-white">
                                      {photo.caption}
                                    </p>
                                  </div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          {statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-0">
                  {statusHistory.map((entry, idx) => (
                    <div key={entry.id} className="relative flex gap-3 pb-4">
                      {/* Vertical line */}
                      {idx < statusHistory.length - 1 && (
                        <div className="absolute left-[9px] top-5 h-full w-0.5 bg-gray-200" />
                      )}
                      {/* Dot */}
                      <div
                        className={cn(
                          'relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2',
                          idx === statusHistory.length - 1
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300 bg-white'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              getStatusColor(entry.status),
                              'text-[10px]'
                            )}
                          >
                            {getStatusLabel(entry.status)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as BookingStatus)
                  }
                  options={ALL_STATUSES}
                />
                <Button
                  className="w-full"
                  onClick={handleUpdateStatus}
                  disabled={
                    updatingStatus || selectedStatus === booking.status
                  }
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Update Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Crew Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Crew Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Currently assigned */}
                {assignments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">
                      Assigned Crew
                    </p>
                    {assignments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                            {a.crew_member?.full_name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {a.crew_member?.full_name || 'Unknown'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCrew(a.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-500">No crew assigned</p>
                )}

                <Separator />

                {/* Assign new crew */}
                <p className="text-xs font-medium text-gray-500">
                  Assign Crew Member
                </p>
                <Select
                  value={selectedCrewId}
                  onChange={(e) => setSelectedCrewId(e.target.value)}
                  placeholder="Select crew member..."
                  options={availableCrew.map((c) => ({
                    value: c.id,
                    label: c.full_name,
                  }))}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAssignCrew}
                  disabled={!selectedCrewId || assigningCrew}
                >
                  {assigningCrew ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Assign Crew
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-gray-400" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    {formatCurrency(booking.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(booking.tax)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Total</span>
                  <span className="text-gray-900">
                    {formatCurrency(booking.total)}
                  </span>
                </div>
                {booking.deposit_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Deposit Required</span>
                    <span className="text-gray-900">
                      {formatCurrency(booking.deposit_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-emerald-600">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                )}

                {/* Payment history */}
                {payments.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-gray-500">
                      Payment History
                    </p>
                    <div className="space-y-1.5">
                      {payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div>
                            <Badge
                              className={cn(
                                getStatusColor(p.status),
                                'mr-1 text-[10px]'
                              )}
                            >
                              {getStatusLabel(p.status)}
                            </Badge>
                            <span className="text-gray-500">
                              {getStatusLabel(p.payment_type)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4 text-gray-400" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.internal_notes && (
                  <div className="max-h-48 overflow-y-auto rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                    {booking.internal_notes}
                  </div>
                )}
                <Textarea
                  placeholder="Add an internal note..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleSaveNotes}
                  disabled={saving || !internalNote.trim()}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled>
                  <Mail className="h-4 w-4" />
                  Send to Customer
                </Button>

                {booking.status !== 'canceled' && (
                  <>
                    {!cancelConfirm ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setCancelConfirm(true)}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Booking
                      </Button>
                    ) : (
                      <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-800">
                          Are you sure you want to cancel this booking?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={handleCancelBooking}
                            disabled={updatingStatus}
                          >
                            {updatingStatus ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Confirm Cancel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setCancelConfirm(false)}
                          >
                            Keep Booking
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
