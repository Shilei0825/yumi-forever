'use client'

import { useEffect, useState, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Play,
  CheckCircle,
  Phone,
  MapPin,
  Navigation,
  Camera,
  Clock,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Mail,
  FileText,
  ListChecks,
  DollarSign,
  Banknote,
  CreditCard,
  UserCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import type {
  Booking,
  BookingStatusHistory,
  BookingItem,
  UploadedPhoto,
} from '@/types'

type BookingWithDetails = Omit<Booking, 'service'> & {
  service?: {
    id: string
    name: string
    description: string
    duration_minutes: number
  }
}

const CHECKLIST_ITEMS = [
  'Arrive at location',
  'Confirm service with customer',
  'Take before photos',
  'Complete service',
  'Take after photos',
  'Customer sign-off',
]

export default function CrewJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const beforeFileRef = useRef<HTMLInputElement>(null)
  const afterFileRef = useRef<HTMLInputElement>(null)

  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [addons, setAddons] = useState<BookingItem[]>([])
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistory[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [checklist, setChecklist] = useState<boolean[]>(
    new Array(CHECKLIST_ITEMS.length).fill(false)
  )
  const [showCompletePrompt, setShowCompletePrompt] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPriceAdjust, setShowPriceAdjust] = useState(false)
  const [adjustPrice, setAdjustPrice] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustError, setAdjustError] = useState('')

  const fetchBookingDetails = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/crew-login')
        return
      }

      // Verify crew assignment
      const { data: assignment } = await supabase
        .from('dispatch_assignments')
        .select('id')
        .eq('booking_id', id)
        .eq('crew_member_id', user.id)
        .single()

      if (!assignment) {
        router.push('/crew/jobs')
        return
      }

      // Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*, service:services(id, name, description, duration_minutes)')
        .eq('id', id)
        .single()

      if (bookingError || !bookingData) {
        console.error('Error fetching booking:', bookingError)
        router.push('/crew/jobs')
        return
      }

      setBooking(bookingData as BookingWithDetails)
      setNotes(bookingData.internal_notes || '')

      // Fetch addons
      const { data: addonData } = await supabase
        .from('booking_items')
        .select('*')
        .eq('booking_id', id)

      if (addonData) setAddons(addonData)

      // Fetch status history
      const { data: historyData } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true })

      if (historyData) setStatusHistory(historyData)

      // Fetch photos
      const { data: photoData } = await supabase
        .from('uploaded_photos')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true })

      if (photoData) setPhotos(photoData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [id, supabase, router])

  useEffect(() => {
    fetchBookingDetails()
  }, [fetchBookingDetails])

  async function handleStartJob() {
    if (!booking) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_job',
          booking_id: booking.id,
        }),
      })

      if (response.ok) {
        await fetchBookingDetails()
      }
    } catch (error) {
      console.error('Start job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCompleteJob(paymentMethod?: 'cash' | 'square_device') {
    if (!booking) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_job',
          booking_id: booking.id,
          payment_method: paymentMethod || undefined,
          notes: completionNotes || undefined,
        }),
      })

      if (response.ok) {
        setShowCompletePrompt(false)
        const label = paymentMethod === 'cash'
          ? 'Job completed — cash collected!'
          : paymentMethod === 'square_device'
            ? 'Job completed — card payment collected!'
            : 'Job completed — customer will pay later.'
        setSuccessMessage(label)
        await fetchBookingDetails()
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } catch (error) {
      console.error('Complete job error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    photoType: 'before' | 'after'
  ) {
    const files = event.target.files
    if (!files || files.length === 0 || !booking) return

    setUploadLoading(photoType)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('booking_id', booking.id)
      formData.append('photo_type', photoType)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setPhotos((prev) => [...prev, data.photo])
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    setUploadLoading(null)
    // Reset input
    event.target.value = ''
  }

  async function handleSaveNotes() {
    if (!booking) return
    setNotesLoading(true)
    try {
      const response = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          booking_id: booking.id,
          note: notes,
        }),
      })

      if (response.ok) {
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 3000)
      }
    } catch (error) {
      console.error('Save notes error:', error)
    } finally {
      setNotesLoading(false)
    }
  }

  function toggleChecklist(index: number) {
    setChecklist((prev) => {
      const updated = [...prev]
      updated[index] = !updated[index]
      return updated
    })
  }

  async function handlePriceAdjustment() {
    if (!booking) return
    const price = parseFloat(adjustPrice)
    if (isNaN(price) || price <= 0) {
      setAdjustError('Please enter a valid price')
      return
    }
    if (adjustReason.trim().length < 3) {
      setAdjustError('Please provide a reason for the adjustment')
      return
    }
    setAdjustLoading(true)
    setAdjustError('')
    try {
      const res = await fetch(`/api/bookings/${booking.id}/adjust-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalPrice: price, reason: adjustReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAdjustError(data.error || 'Failed to adjust price')
      } else {
        setShowPriceAdjust(false)
        setSuccessMessage('Price adjusted successfully!')
        await fetchBookingDetails()
        setTimeout(() => setSuccessMessage(''), 5000)
      }
    } catch {
      setAdjustError('An error occurred')
    } finally {
      setAdjustLoading(false)
    }
  }

  function getDirectionsUrl(address: string) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  }

  const beforePhotos = photos.filter((p) => p.photo_type === 'before')
  const afterPhotos = photos.filter((p) => p.photo_type === 'after')

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-gray-500">Job not found</p>
        <Link href="/crew/jobs" className="mt-3 text-sm text-blue-600 underline">
          Back to Jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex min-h-[44px] items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        </div>
      )}

      {/* Top Section: Service, Status, Booking Number */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {booking.service?.name || 'Service'}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              #{booking.booking_number}
            </p>
          </div>
          <Badge className={cn('text-sm', getStatusColor(booking.status))}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      {(booking.status === 'assigned' || booking.status === 'on_the_way') && (
        <Button
          className="h-14 w-full bg-green-600 text-lg font-semibold text-white hover:bg-green-700"
          onClick={handleStartJob}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <Play className="mr-2 h-6 w-6" />
          )}
          Start Job
        </Button>
      )}

      {booking.status === 'in_progress' && !showCompletePrompt && (
        <Button
          className="h-14 w-full bg-blue-600 text-lg font-semibold text-white hover:bg-blue-700"
          onClick={() => setShowCompletePrompt(true)}
          disabled={actionLoading}
        >
          <CheckCircle className="mr-2 h-6 w-6" />
          Complete Job
        </Button>
      )}

      {/* Complete Job Prompt */}
      {showCompletePrompt && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Complete This Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Any final notes? (optional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
              className="min-h-[80px] text-base"
            />

            <p className="text-sm font-medium text-gray-700">How was payment collected?</p>
            <div className="space-y-2">
              <Button
                className="h-14 w-full bg-green-600 text-base font-semibold text-white hover:bg-green-700"
                onClick={() => handleCompleteJob('cash')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Banknote className="mr-2 h-5 w-5" />
                )}
                Complete — Cash Paid
              </Button>
              <Button
                className="h-14 w-full bg-blue-600 text-base font-semibold text-white hover:bg-blue-700"
                onClick={() => handleCompleteJob('square_device')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-5 w-5" />
                )}
                Complete — Card Collected
              </Button>
              <Button
                variant="outline"
                className="h-14 w-full text-base font-semibold"
                onClick={() => handleCompleteJob()}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-5 w-5" />
                )}
                Complete — Customer Pays Later
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-10 w-full text-sm text-gray-500"
              onClick={() => setShowCompletePrompt(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-base font-medium text-gray-900">
              {booking.customer_name}
            </p>
            {booking.customer_email && (
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-3.5 w-3.5" />
                {booking.customer_email}
              </div>
            )}
          </div>
          {booking.customer_phone && (
            <a
              href={`tel:${booking.customer_phone}`}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base font-medium text-green-700 transition-colors hover:bg-green-100 active:bg-green-200"
            >
              <Phone className="h-5 w-5" />
              Call Customer
            </a>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base text-gray-900">{booking.address_text}</p>

          {booking.gate_code && (
            <div className="rounded-md bg-yellow-50 px-3 py-2">
              <p className="text-xs font-medium uppercase text-yellow-700">
                Gate Code
              </p>
              <p className="text-lg font-bold text-yellow-900">
                {booking.gate_code}
              </p>
            </div>
          )}

          {booking.parking_instructions && (
            <div className="rounded-md bg-gray-50 px-3 py-2">
              <p className="text-xs font-medium uppercase text-gray-500">
                Parking
              </p>
              <p className="text-sm text-gray-700">
                {booking.parking_instructions}
              </p>
            </div>
          )}

          <a
            href={getDirectionsUrl(booking.address_text)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-base font-medium text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-200"
          >
            <Navigation className="h-5 w-5" />
            Get Directions
          </a>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Service</span>
            <span className="font-medium text-gray-900">
              {booking.service?.name}
            </span>
          </div>

          {addons.length > 0 && (
            <div>
              <span className="text-sm text-gray-500">Add-ons</span>
              <ul className="mt-1 space-y-1">
                {addons.map((addon) => (
                  <li
                    key={addon.id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    {addon.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Est. Duration</span>
            <span className="flex items-center gap-1 font-medium text-gray-900">
              <Clock className="h-4 w-4 text-gray-400" />
              {booking.estimated_duration || booking.service?.duration_minutes || '?'} min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Scheduled</span>
            <span className="font-medium text-gray-900">
              {formatDate(booking.scheduled_date)} at{' '}
              {formatTime(booking.scheduled_time)}
            </span>
          </div>

          {booking.service_notes && (
            <div className="rounded-md bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium uppercase text-amber-700">
                Special Instructions
              </p>
              <p className="mt-1 text-sm text-amber-900">
                {booking.service_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Quoted Price</span>
            <span className={cn('font-medium', booking.final_price ? 'text-gray-400 line-through' : 'text-gray-900')}>
              {formatCurrency(booking.total)}
            </span>
          </div>

          {booking.final_price !== null && booking.final_price !== undefined && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Adjusted Price</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(booking.final_price)}
                </span>
              </div>
              {booking.adjustment_reason && (
                <div className="rounded-md bg-amber-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase text-amber-700">Adjustment Reason</p>
                  <p className="mt-0.5 text-sm text-amber-900">{booking.adjustment_reason}</p>
                </div>
              )}
            </>
          )}

          {!showPriceAdjust ? (
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => {
                setAdjustPrice(((booking.final_price ?? booking.total) / 100).toFixed(2))
                setAdjustReason('')
                setAdjustError('')
                setShowPriceAdjust(true)
              }}
            >
              <DollarSign className="mr-2 h-5 w-5" />
              Adjust Price
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  New Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={adjustPrice}
                  onChange={(e) => setAdjustPrice(e.target.value)}
                  className="text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="e.g., Extra large walk-in closet not in estimate"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={3}
                  className="min-h-[80px] text-base"
                />
              </div>
              {adjustError && (
                <p className="text-sm text-red-600">{adjustError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-12 flex-1 text-base"
                  onClick={() => setShowPriceAdjust(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-12 flex-1 text-base"
                  onClick={handlePriceAdjustment}
                  disabled={adjustLoading}
                >
                  {adjustLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Upload Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Before Photos */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Before Photos
            </p>
            {beforePhotos.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {beforePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Before photo'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <input
              ref={beforeFileRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoUpload(e, 'before')}
            />
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => beforeFileRef.current?.click()}
              disabled={uploadLoading === 'before'}
            >
              {uploadLoading === 'before' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Camera className="mr-2 h-5 w-5" />
              )}
              {uploadLoading === 'before'
                ? 'Uploading...'
                : beforePhotos.length > 0
                  ? 'Add More Before Photos'
                  : 'Take Before Photos'}
            </Button>
          </div>

          <Separator />

          {/* After Photos */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              After Photos
            </p>
            {afterPhotos.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {afterPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'After photo'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <input
              ref={afterFileRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoUpload(e, 'after')}
            />
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => afterFileRef.current?.click()}
              disabled={uploadLoading === 'after'}
            >
              {uploadLoading === 'after' ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Camera className="mr-2 h-5 w-5" />
              )}
              {uploadLoading === 'after'
                ? 'Uploading...'
                : afterPhotos.length > 0
                  ? 'Add More After Photos'
                  : 'Take After Photos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add notes about this job..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setNotesSaved(false)
            }}
            rows={4}
            className="min-h-[100px] text-base"
          />
          <div className="flex items-center gap-3">
            <Button
              className="h-12 flex-1 text-base"
              onClick={handleSaveNotes}
              disabled={notesLoading}
            >
              {notesLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Save Notes
            </Button>
            {notesSaved && (
              <span className="text-sm font-medium text-green-600">
                Saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4" />
            Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {CHECKLIST_ITEMS.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggleChecklist(index)}
                  className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                      checklist[index]
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300'
                    )}
                  >
                    {checklist[index] && (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-base',
                      checklist[index]
                        ? 'text-gray-400 line-through'
                        : 'text-gray-900'
                    )}
                  >
                    {item}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-center text-sm text-gray-500">
            {checklist.filter(Boolean).length} of {CHECKLIST_ITEMS.length}{' '}
            completed
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusHistory.map((entry, index) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        index === statusHistory.length - 1
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    </div>
                    {index < statusHistory.length - 1 && (
                      <div className="my-1 h-full w-px bg-gray-200" />
                    )}
                  </div>
                  <div className="min-w-0 pb-3">
                    <Badge
                      className={cn(
                        'text-xs',
                        getStatusColor(entry.status)
                      )}
                    >
                      {getStatusLabel(entry.status)}
                    </Badge>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(entry.created_at)}
                    </p>
                    {entry.notes && (
                      <p className="mt-0.5 text-sm text-gray-600">
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
  )
}
