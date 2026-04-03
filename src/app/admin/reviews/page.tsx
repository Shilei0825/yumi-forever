import { createClient } from '@supabase/supabase-js'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Star, MessageSquare, Award } from 'lucide-react'
import { ReviewActions } from './review-actions'
import type { Review } from '@/types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function AdminReviewsPage() {
  const supabase = getServiceClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  const allReviews = (reviews || []) as Review[]

  // Calculate stats
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
  const averageRating =
    allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : '0.0'
  const approvedCount = allReviews.filter((r) => r.is_approved).length
  const pendingCount = allReviews.filter((r) => !r.is_approved).length
  const featuredCount = allReviews.filter((r) => r.is_featured).length

  // Rating distribution
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const review of allReviews) {
    distribution[review.rating] = (distribution[review.rating] || 0) + 1
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage, approve, and feature customer reviews.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Average Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-gray-900">{averageRating}</p>
                  <span className="text-sm text-gray-500">/ 5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{allReviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-medium text-gray-500">Rating Distribution</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-gray-500">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{
                        width:
                          allReviews.length > 0
                            ? `${(distribution[star] / allReviews.length) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-gray-500">
                    {distribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Reviews</CardTitle>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge variant="success">{approvedCount} approved</Badge>
              <Badge variant="warning">{pendingCount} pending</Badge>
              <Badge variant="default">{featuredCount} featured</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allReviews.length === 0 ? (
            <div className="py-12 text-center">
              <Star className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Customer
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Rating
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Comment
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Service
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-gray-500">
                      Date
                    </th>
                    <th className="pb-3 pr-4 text-center font-medium text-gray-500">
                      Approved
                    </th>
                    <th className="pb-3 text-center font-medium text-gray-500">
                      Featured
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.customer_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {review.customer_email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{renderStars(review.rating)}</td>
                      <td className="max-w-xs py-3 pr-4 text-gray-600">
                        <p className="line-clamp-2">{review.comment || '--'}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">
                        {review.service_name || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-gray-500">
                        {formatDate(review.created_at)}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <ReviewActions
                          reviewId={review.id}
                          field="is_approved"
                          currentValue={review.is_approved}
                          labelOn="Approved"
                          labelOff="Pending"
                          rating={review.rating}
                          hasProfileId={!!review.profile_id}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <ReviewActions
                          reviewId={review.id}
                          field="is_featured"
                          currentValue={review.is_featured}
                          labelOn="Featured"
                          labelOff="Normal"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
