"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Calendar, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

interface BookingData {
  booking_number: string
  service_name: string
  scheduled_date: string
  scheduled_time: string
  total: number
  deposit_amount: number
  deposit_paid: number
  remaining_balance: number
  payment_status: string
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("booking_id")
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!bookingId) {
      setError(true)
      setLoading(false)
      return
    }

    fetch(`/api/bookings/${bookingId}/public`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        setBooking(data.booking)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [bookingId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="mt-4 text-sm text-gray-500">
            Loading your booking details...
          </p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md rounded-2xl border-gray-200 shadow-none">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Not Found
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              We couldn&apos;t find this booking. Please check your email for
              booking details.
            </p>
            <Button className="mt-6 w-full" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <Card className="rounded-2xl border-gray-200 shadow-none">
          <CardHeader className="items-center pb-2 pt-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" strokeWidth={3} />
            </div>
            <CardTitle className="mt-4 text-center text-2xl font-bold text-gray-900">
              Booking Confirmed!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-2">
            {/* Booking Number */}
            <div className="rounded-xl bg-gray-50 px-4 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                Booking Number
              </p>
              <p className="mt-1 text-xl font-bold tracking-wider text-primary">
                {booking.booking_number}
              </p>
            </div>

            {/* Service */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-500">Service</span>
                <span className="ml-auto font-medium text-gray-900">
                  {booking.service_name}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-500">Date</span>
                <span className="ml-auto font-medium text-gray-900">
                  {formatDate(booking.scheduled_date)}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-500">Time</span>
                <span className="ml-auto font-medium text-gray-900">
                  {formatTime(booking.scheduled_time)}
                </span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Price</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.total)}
                </span>
              </div>
              {booking.deposit_amount > 0 && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">
                    {booking.deposit_paid > 0 ? 'Deposit Paid' : 'Deposit Due'}
                  </span>
                  <span className={`font-medium ${booking.deposit_paid > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {formatCurrency(booking.deposit_amount)}
                  </span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm">
                <span className="text-gray-500">Remaining Balance</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(booking.remaining_balance)}
                </span>
              </div>
              {booking.payment_status === 'unpaid' && booking.deposit_amount > 0 && (
                <p className="mt-3 text-center text-xs text-amber-600">
                  Complete your deposit payment to confirm this booking.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3 px-6 pb-8 pt-4">
            <Button className="w-full" asChild>
              <Link href={`/signup?booking_id=${bookingId}`}>
                Create an Account to Manage Bookings
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            <p className="mt-4 text-sm text-gray-500">
              Loading your booking details...
            </p>
          </div>
        </div>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  )
}
