'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Star, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

interface BookingInfo {
  booking_number: string
  customer_name: string
  customer_email: string
  service_name: string
  scheduled_date: string
}

function ReviewPageContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(!!bookingId)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [serviceName, setServiceName] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Fetch booking details if booking_id is provided
  useEffect(() => {
    if (!bookingId) return

    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/public`)
        if (!res.ok) {
          setLoadingBooking(false)
          return
        }
        const data = await res.json()
        const booking = data.booking

        setBookingInfo({
          booking_number: booking.booking_number,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          service_name: booking.service_name || 'Service',
          scheduled_date: booking.scheduled_date,
        })

        // Pre-fill the form
        setCustomerName(booking.customer_name || '')
        setCustomerEmail(booking.customer_email || '')
        setServiceName(booking.service_name || '')
      } catch {
        // Silently fail — user can still fill in manually
      } finally {
        setLoadingBooking(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a rating.')
      return
    }
    if (!customerName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!customerEmail.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!serviceName.trim()) {
      setError('Please enter the service name.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId || null,
          rating,
          comment: comment.trim() || null,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          service_name: serviceName.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to submit review. Please try again.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        {/* Hero */}
        <section className="bg-dark">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Thank You!
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
                Your review has been submitted successfully.
              </p>
            </div>
          </div>
        </section>

        {/* Success message */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-lg px-4 text-center sm:px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Review Submitted
            </h2>
            <p className="mt-3 text-gray-600">
              Thank you for taking the time to share your experience with us.
              Your review will be published after it has been reviewed by our team.
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${
                    i < rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="mt-8">
              <Button asChild>
                <a href="/">Back to Home</a>
              </Button>
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-dark">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Leave a Review
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
              We value your feedback! Tell us about your experience with Yumi Forever.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          {loadingBooking ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Booking context card */}
              {bookingInfo && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Service</CardTitle>
                    <CardDescription>
                      Reviewing your experience with booking #{bookingInfo.booking_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Service</p>
                        <p className="mt-1 text-gray-900">{bookingInfo.service_name}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Date</p>
                        <p className="mt-1 text-gray-900">
                          {new Date(bookingInfo.scheduled_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Star Rating */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="rounded-sm p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-3 text-sm text-gray-500">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment */}
                <Textarea
                  label="Your Review"
                  placeholder="Tell us about your experience... What did you like? What can we improve?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                />

                {/* Customer Details */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    label="Your Name"
                    placeholder="John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={!!bookingInfo}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    disabled={!!bookingInfo}
                  />
                </div>

                {/* Service Name */}
                {!bookingInfo && (
                  <Input
                    label="Service Received"
                    placeholder="e.g. Full Interior Detailing"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    required
                  />
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  Your review will be published after approval by our team.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  )
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
            <div className="mx-auto h-4 w-64 rounded bg-gray-200" />
          </div>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  )
}
