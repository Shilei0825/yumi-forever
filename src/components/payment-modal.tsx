'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, CreditCard, Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (data: { payment_id: string; booking_id: string }) => void
  bookingId: string
  amount: number // cents
  paymentType: 'deposit' | 'balance' | 'full'
  customerEmail?: string
  serviceName?: string
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>
    }
  }
}

interface SquarePayments {
  card: (options?: Record<string, unknown>) => Promise<SquareCard>
}

interface SquareCard {
  attach: (selector: string) => Promise<void>
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>
  destroy: () => void
}

export function PaymentModal({
  open,
  onClose,
  onSuccess,
  bookingId,
  amount,
  paymentType,
  customerEmail,
  serviceName,
}: PaymentModalProps) {
  const cardRef = useRef<SquareCard | null>(null)
  const [cardReady, setCardReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const initRef = useRef(false)

  const initializeCard = useCallback(async () => {
    if (!open || initRef.current) return

    // Wait for Square SDK script to load
    const waitForSquare = () =>
      new Promise<void>((resolve) => {
        if (window.Square) {
          resolve()
          return
        }
        const interval = setInterval(() => {
          if (window.Square) {
            clearInterval(interval)
            resolve()
          }
        }, 100)
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(interval)
          resolve()
        }, 10000)
      })

    await waitForSquare()

    if (!window.Square) {
      setError('Payment system failed to load. Please refresh and try again.')
      return
    }

    try {
      initRef.current = true
      const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || ''
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''

      const payments = await window.Square.payments(appId, locationId)
      const card = await payments.card({
        style: {
          '.input-container': {
            borderColor: '#e5e7eb',
            borderRadius: '8px',
          },
          '.input-container.is-focus': {
            borderColor: '#000',
          },
          input: {
            fontSize: '14px',
            color: '#111827',
          },
          'input::placeholder': {
            color: '#9ca3af',
          },
        },
      })

      await card.attach('#sq-card-container')
      cardRef.current = card
      setCardReady(true)
    } catch (err) {
      console.error('Square card init error:', err)
      setError('Failed to initialize payment form. Please try again.')
      initRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setError(null)
      setSuccess(false)
      // Small delay so DOM is rendered
      const timer = setTimeout(initializeCard, 200)
      return () => clearTimeout(timer)
    } else {
      // Cleanup card on close
      if (cardRef.current) {
        try {
          cardRef.current.destroy()
        } catch {
          // Ignore
        }
        cardRef.current = null
      }
      setCardReady(false)
      initRef.current = false
    }
  }, [open, initializeCard])

  async function handlePay() {
    if (!cardRef.current || processing) return

    setProcessing(true)
    setError(null)

    try {
      const result = await cardRef.current.tokenize()

      if (result.status !== 'OK' || !result.token) {
        const errMsg = result.errors?.[0]?.message || 'Card verification failed'
        setError(errMsg)
        setProcessing(false)
        return
      }

      // Send token to server
      const res = await fetch('/api/square/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: result.token,
          booking_id: bookingId,
          amount,
          payment_type: paymentType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Payment failed. Please try again.')
        setProcessing(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess(data)
      }, 1500)
    } catch (err) {
      setError('Payment failed. Please check your card details and try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform overflow-y-auto bg-white transition-transform duration-300 ease-out sm:rounded-l-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {success ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Successful!
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Your {paymentType === 'deposit' ? 'deposit' : 'payment'} of{' '}
                {formatCurrency(amount)} has been processed.
              </p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {serviceName || 'Yumi Forever Service'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 capitalize">
                      {paymentType === 'deposit'
                        ? 'Deposit Payment'
                        : paymentType === 'balance'
                          ? 'Remaining Balance'
                          : 'Full Payment'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </p>
                </div>
              </div>

              {/* Card Form */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Card Details
                </label>
                <div
                  id="sq-card-container"
                  className="min-h-[130px] rounded-lg border border-gray-200 bg-white p-1"
                >
                  {!cardReady && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2 text-sm text-gray-400">
                        Loading payment form...
                      </span>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Pay Button */}
                <Button
                  onClick={handlePay}
                  disabled={!cardReady || processing}
                  className="w-full py-6 text-base font-semibold"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {formatCurrency(amount)}</>
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span>Secured by Square. Your card info never touches our servers.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
