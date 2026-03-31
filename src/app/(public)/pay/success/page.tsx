"use client"

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface BookingInfo {
  booking_number: string
  customer_name: string
  service_name: string
  total: number
  scheduled_date: string
}

function PaySuccessPageContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      loadBooking(bookingId)
    } else {
      setLoading(false)
    }
  }, [bookingId])

  async function loadBooking(id: string) {
    try {
      const res = await fetch(`/api/bookings/${id}/public`)
      const data = await res.json()

      if (res.ok && data.booking) {
        setBooking(data.booking)
      }
    } catch {
      // Silently fail - we'll still show the generic success message
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#57068C]" />
            </div>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900">
                Payment Received!
              </h1>

              <p className="mt-2 text-gray-500">
                Thank you for your payment. Your balance has been settled.
              </p>

              {booking && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Booking</span>
                    <span className="font-medium text-gray-900">
                      #{booking.booking_number}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service</span>
                    <span className="font-medium text-gray-900">
                      {booking.service_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(booking.scheduled_date)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(booking.total)}
                    </span>
                  </div>
                </div>
              )}

              <p className="mt-6 text-sm text-gray-400">
                A receipt has been sent to your email by Stripe.
              </p>

              <div className="mt-6">
                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaySuccessPage() {
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
      <PaySuccessPageContent />
    </Suspense>
  )
}
