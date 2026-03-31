'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Star,
  MessageSquare,
  Calendar,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatDate } from '@/lib/utils'
import type { Review } from '@/types'

interface ReviewWithBooking extends Review {
  booking?: {
    id: string
    booking_number: string
    scheduled_date: string
    service?: { name: string }
  }
}

interface UnreviewedBooking {
  id: string
  booking_number: string
  scheduled_date: string
  status: string
  service?: { name: string }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithBooking[]>([])
  const [unreviewedBookings, setUnreviewedBookings] = useState<
    UnreviewedBooking[]
  >([])
  const [loading, setLoading] = useState(true)
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // Fetch existing reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, booking:bookings(*, service:services(name))')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch completed bookings
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('profile_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    const existingReviewBookingIds = new Set(
      (reviewsData || []).map((r: ReviewWithBooking) => r.booking_id)
    )

    const unreviewed = (completedBookings || []).filter(
      (b: UnreviewedBooking) => !existingReviewBookingIds.has(b.id)
    )

    setReviews((reviewsData || []) as ReviewWithBooking[])
    setUnreviewedBookings(unreviewed as UnreviewedBooking[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubmitReview(bookingId: string) {
    if (rating === 0) return
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        profile_id: user.id,
        rating,
        comment: comment.trim() || null,
      })
      .select('*, booking:bookings(*, service:services(name))')
      .single()

    if (!error && data) {
      setReviews((prev) => [data as ReviewWithBooking, ...prev])
      setUnreviewedBookings((prev) =>
        prev.filter((b) => b.id !== bookingId)
      )
      setSubmitted(true)
      setTimeout(() => {
        setActiveBookingId(null)
        setRating(0)
        setHoverRating(0)
        setComment('')
        setSubmitted(false)
      }, 2000)
    }

    setSubmitting(false)
  }

  function renderStars(
    count: number,
    interactive = false,
    size: 'sm' | 'lg' = 'sm'
  ) {
    const iconSize = size === 'lg' ? 'h-7 w-7' : 'h-4 w-4'

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const displayRating = interactive ? hoverRating || rating : count

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={cn(
                'transition-colors',
                interactive
                  ? 'cursor-pointer hover:scale-110'
                  : 'cursor-default',
                star <= displayRating
                  ? 'text-amber-400'
                  : 'text-gray-200'
              )}
            >
              <Star
                className={cn(
                  iconSize,
                  star <= displayRating && 'fill-current'
                )}
              />
            </button>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Share your experience and view your past reviews.
        </p>
      </div>

      {/* Unreviewed Bookings */}
      {unreviewedBookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Awaiting Your Review
          </h3>
          <div className="space-y-3">
            {unreviewedBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.service?.name || 'Service'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booking.scheduled_date)}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        #{booking.booking_number}
                      </p>
                    </div>
                    {activeBookingId !== booking.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveBookingId(booking.id)
                          setRating(0)
                          setHoverRating(0)
                          setComment('')
                          setSubmitted(false)
                        }}
                      >
                        <Star className="h-4 w-4" />
                        Leave Review
                      </Button>
                    )}
                  </div>

                  {/* Review Form */}
                  {activeBookingId === booking.id && (
                    <>
                      <Separator className="my-4" />

                      {submitted ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <CheckCircle className="mb-2 h-10 w-10 text-green-500" />
                          <p className="font-medium text-gray-900">
                            Thank you for your review!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Star Rating */}
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Rating
                            </label>
                            {renderStars(rating, true, 'lg')}
                            {rating > 0 && (
                              <p className="mt-1 text-sm text-gray-500">
                                {rating === 1
                                  ? 'Poor'
                                  : rating === 2
                                    ? 'Fair'
                                    : rating === 3
                                      ? 'Good'
                                      : rating === 4
                                        ? 'Very Good'
                                        : 'Excellent'}
                              </p>
                            )}
                          </div>

                          {/* Comment */}
                          <Textarea
                            label="Comment (optional)"
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                          />

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={rating === 0 || submitting}
                              onClick={() =>
                                handleSubmitReview(booking.id)
                              }
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveBookingId(null)
                                setRating(0)
                                setHoverRating(0)
                                setComment('')
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Existing Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Reviews</h3>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-900">No reviews yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Complete a booking to leave a review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">
                          {review.booking?.service?.name || 'Service'}
                        </p>
                        {renderStars(review.rating)}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {review.comment}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
