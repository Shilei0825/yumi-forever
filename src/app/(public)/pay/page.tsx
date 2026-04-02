"use client"

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, CreditCard, Loader2, AlertCircle } from 'lucide-react'

interface BookingResult {
  booking_id: string
  booking_number: string
  service_name: string
  scheduled_date: string
  total_amount: number
  deposit_paid: number
  remaining_balance: number
}

interface TokenResult {
  payment_link: {
    id: string
    amount: number
    token: string
    expires_at: string
  }
  booking: BookingResult
}

function PayPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [lookupType, setLookupType] = useState<'email' | 'phone'>('email')
  const [lookupValue, setLookupValue] = useState('')
  const [bookings, setBookings] = useState<BookingResult[]>([])
  const [tokenData, setTokenData] = useState<TokenResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  // If token is present, load payment link details
  useEffect(() => {
    if (token) {
      loadTokenData(token)
    }
  }, [token])

  async function loadTokenData(t: string) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/payment-links/${t}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid or expired payment link')
        return
      }

      setTokenData(data)
    } catch {
      setError('Failed to load payment link')
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!lookupValue.trim()) return

    setLoading(true)
    setError('')
    setBookings([])
    setSearched(true)

    try {
      const param = lookupType === 'email'
        ? `email=${encodeURIComponent(lookupValue.trim())}`
        : `phone=${encodeURIComponent(lookupValue.trim())}`

      const res = await fetch(`/api/bookings/lookup?${param}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to look up bookings')
        return
      }

      setBookings(data.bookings || [])
    } catch {
      setError('Failed to look up bookings')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayNow(bookingId: string, amount: number, payToken?: string) {
    setPaying(bookingId)
    setError('')

    try {
      const res = await fetch('/api/square/checkout-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          amount,
          token: payToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create checkout session')
        setPaying(null)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError('Failed to create checkout session')
      setPaying(null)
    }
  }

  // Token-based view
  if (token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Pay Remaining Balance</h1>
          <p className="mt-2 text-gray-500">
            Complete your payment for Yumi Forever services.
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#57068C]" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {tokenData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Booking #{tokenData.booking.booking_number}
              </CardTitle>
              <CardDescription>
                {tokenData.booking.service_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service Date</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(tokenData.booking.scheduled_date)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(tokenData.booking.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Deposit Paid</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(tokenData.booking.deposit_paid)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Amount Due</span>
                  <span className="text-lg font-bold text-[#57068C]">
                    {formatCurrency(tokenData.payment_link.amount)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-[#57068C] hover:bg-[#57068C]/90 text-white"
                size="lg"
                disabled={paying === tokenData.booking.booking_id}
                onClick={() =>
                  handlePayNow(
                    tokenData.booking.booking_id,
                    tokenData.payment_link.amount,
                    tokenData.payment_link.token
                  )
                }
              >
                {paying === tokenData.booking.booking_id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {formatCurrency(tokenData.payment_link.amount)}
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Secure payment powered by Square
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Email/phone lookup view
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Pay Remaining Balance</h1>
        <p className="mt-2 text-gray-500">
          Look up your booking to pay the remaining balance online.
        </p>
      </div>

      {/* Lookup Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Find Your Booking</CardTitle>
          <CardDescription>
            Enter the email or phone number used when booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLookup} className="space-y-4">
            {/* Toggle between email and phone */}
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  lookupType === 'email'
                    ? 'bg-[#57068C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setLookupType('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  lookupType === 'phone'
                    ? 'bg-[#57068C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setLookupType('phone')}
              >
                Phone
              </button>
            </div>

            <Input
              type={lookupType === 'email' ? 'email' : 'tel'}
              placeholder={
                lookupType === 'email'
                  ? 'your@email.com'
                  : '(555) 123-4567'
              }
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full bg-[#57068C] hover:bg-[#57068C]/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Look Up Bookings
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searched && !loading && bookings.length === 0 && !error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-sm text-gray-500">
              No bookings with outstanding balances found. If you believe this is an error,
              please contact us.
            </p>
          </CardContent>
        </Card>
      )}

      {bookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Outstanding Balances ({bookings.length})
          </h2>

          {bookings.map((booking) => (
            <Card key={booking.booking_id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900">
                      {booking.service_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Booking #{booking.booking_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.scheduled_date)}
                    </p>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="text-sm text-gray-500">
                      Total: {formatCurrency(booking.total_amount)}
                    </div>
                    <div className="text-sm text-green-600">
                      Deposit: -{formatCurrency(booking.deposit_paid)}
                    </div>
                    <div className="text-lg font-bold text-[#57068C]">
                      Due: {formatCurrency(booking.remaining_balance)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full bg-[#57068C] hover:bg-[#57068C]/90 text-white"
                    disabled={paying === booking.booking_id}
                    onClick={() =>
                      handlePayNow(booking.booking_id, booking.remaining_balance)
                    }
                  >
                    {paying === booking.booking_id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pay {formatCurrency(booking.remaining_balance)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <p className="text-center text-xs text-gray-400">
            Secure payments powered by Square
          </p>
        </div>
      )}
    </div>
  )
}

export default function PayPage() {
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
      <PayPageContent />
    </Suspense>
  )
}
