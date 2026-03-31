"use client"

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

interface BookingDetail {
  id: string
  booking_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  scheduled_date: string
  total: number
  deposit_amount: number
  remaining_balance: number
  payment_status: string
  status: string
  service?: { name: string }
}

export default function AdminPaymentLinksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [computedRemaining, setComputedRemaining] = useState(0)
  const [amount, setAmount] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    setBooking(null)
    setGeneratedUrl('')

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*, service:services(name)')
        .ilike('booking_number', `%${searchQuery.trim()}%`)
        .single()

      if (fetchError || !data) {
        setError('Booking not found. Check the booking number and try again.')
        setLoading(false)
        return
      }

      // Calculate actual remaining from payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('booking_id', data.id)
        .in('status', ['paid', 'deposit_paid'])

      const totalPaid = (payments || []).reduce(
        (sum: number, p: { amount: number }) => sum + p.amount,
        0
      )
      const remaining = Math.max(0, data.total - totalPaid)

      setBooking(data)
      setComputedRemaining(remaining)
      setAmount((remaining / 100).toFixed(2))
    } catch {
      setError('Failed to search for booking')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!booking) return

    const amountCents = Math.round(parseFloat(amount) * 100)

    if (isNaN(amountCents) || amountCents <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amountCents > computedRemaining) {
      setError('Amount exceeds remaining balance')
      return
    }

    setGenerating(true)
    setError('')
    setGeneratedUrl('')

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: amountCents,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate payment link')
        return
      }

      setGeneratedUrl(data.url)
    } catch {
      setError('Failed to generate payment link')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = generatedUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/payments"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Payments
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Generate Payment Link</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a payment link to send to a customer for their remaining balance.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find Booking</CardTitle>
          <CardDescription>
            Search by booking number (e.g., YC-ABC123-XYZ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter booking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="bg-[#57068C] hover:bg-[#57068C]/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      {booking && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Booking #{booking.booking_number}
                </CardTitle>
                <CardDescription>
                  {booking.service?.name || 'Service'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusLabel(booking.status)}
                </Badge>
                <Badge className={getStatusColor(booking.payment_status)}>
                  {getStatusLabel(booking.payment_status)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">
                  {booking.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{booking.customer_email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Date</p>
                <p className="text-sm text-gray-900">
                  {formatDate(booking.scheduled_date)}
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit Paid</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(booking.deposit_amount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">
                  Remaining Balance
                </span>
                <span className="text-lg font-bold text-[#57068C]">
                  {formatCurrency(computedRemaining)}
                </span>
              </div>
            </div>

            {computedRemaining > 0 ? (
              <>
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount to Charge (in dollars)
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.50"
                        max={(computedRemaining / 100).toFixed(2)}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#57068C] focus-visible:ring-offset-1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-[#57068C] hover:bg-[#57068C]/90 text-white"
                      disabled={generating}
                      onClick={handleGenerate}
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          Generate Payment Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Generated Link */}
                {generatedUrl && (
                  <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <p className="font-medium text-green-800">
                        Payment link generated successfully!
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedUrl}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopy}
                        className="shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      This link expires in 7 days. Send it to the customer via
                      email, text, or any messaging platform.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  This booking is fully paid. No payment link needed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
