"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Calendar, Clock, MapPin, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, formatTime } from "@/lib/utils"

interface BookingInfo {
  booking_number: string
  customer_name: string
  scheduled_date: string
  scheduled_time: string
  address_text: string
  total: number
  deposit_amount: number
  remaining_balance: number
  status: string
  service_name: string
  booking_items: { name: string; price: number }[]
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("booking_id")
  const [booking, setBooking] = useState<BookingInfo | null>(null)
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
      <section className="bg-white py-24">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-neutral-500">Loading your booking details...</p>
        </div>
      </section>
    )
  }

  if (error || !booking) {
    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Booking Not Found</h1>
          <p className="mt-4 text-neutral-600">
            We couldn&apos;t find this booking. Please check your email for booking details.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-lg px-4">
        {/* Success Icon */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Booking Confirmed!
          </h1>
          <p className="mt-2 text-neutral-600">
            A confirmation email has been sent to your inbox.
          </p>
        </div>

        {/* Booking Number */}
        <div className="mt-8 rounded-lg border border-violet-200 bg-violet-50 p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Booking Number
          </p>
          <p className="mt-2 text-2xl font-bold tracking-wider text-primary">
            {booking.booking_number}
          </p>
        </div>

        {/* Details */}
        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-sm text-neutral-500">Date</p>
              <p className="font-medium text-neutral-900">{formatDate(booking.scheduled_date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-sm text-neutral-500">Time</p>
              <p className="font-medium text-neutral-900">{formatTime(booking.scheduled_time)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-sm text-neutral-500">Location</p>
              <p className="font-medium text-neutral-900">{booking.address_text}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-5 w-5 text-neutral-400" />
            <div>
              <p className="text-sm text-neutral-500">Service</p>
              <p className="font-medium text-neutral-900">{booking.service_name}</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-8 rounded-lg border border-neutral-200 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Total</span>
            <span className="font-medium text-neutral-900">{formatCurrency(booking.total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-neutral-500">Deposit Paid</span>
            <span className="font-medium text-primary">{formatCurrency(booking.deposit_amount)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm border-t border-neutral-100 pt-2">
            <span className="text-neutral-500">Remaining Balance</span>
            <span className="font-medium text-neutral-900">{formatCurrency(booking.remaining_balance)}</span>
          </div>
        </div>

        {/* Free Cancellation */}
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Free cancellation available</p>
          <p className="mt-1 text-xs text-green-700">
            Cancel at least 24 hours before your appointment and your full deposit will be returned to your card within 5-10 business days.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild>
            <Link href="/signup">Create an Account to Manage Bookings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-white py-24">
          <div className="mx-auto max-w-lg px-4 text-center">
            <p className="text-neutral-500">Loading your booking details...</p>
          </div>
        </section>
      }
    >
      <BookingConfirmationContent />
    </Suspense>
  )
}
