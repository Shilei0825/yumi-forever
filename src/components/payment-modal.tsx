'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, CreditCard, Loader2, CheckCircle, AlertCircle, Lock, Gift, Minus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface ReviewCredit {
  id: string
  amount: number
  remaining: number
  status: string
  expires_at: string
}

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
  const [initFailed, setInitFailed] = useState(false)

  // Credit state
  const [credits, setCredits] = useState<ReviewCredit[]>([])
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [creditToApply, setCreditToApply] = useState(0)
  const [loadingCredits, setLoadingCredits] = useState(false)

  const chargeAmount = Math.max(0, amount - creditToApply)

  // Fetch available credits when modal opens
  useEffect(() => {
    if (!open) return
    setLoadingCredits(true)
    fetch('/api/credits')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalAvailable > 0) {
          setCredits(data.credits.filter((c: ReviewCredit) => c.status === 'active'))
          setTotalAvailable(data.totalAvailable)
        } else {
          setCredits([])
          setTotalAvailable(0)
        }
      })
      .catch(() => {
        setCredits([])
        setTotalAvailable(0)
      })
      .finally(() => setLoadingCredits(false))
  }, [open])

  // Reset credit when modal closes
  useEffect(() => {
    if (!open) {
      setCreditToApply(0)
      setCredits([])
      setTotalAvailable(0)
    }
  }, [open])

  const maxCredit = Math.min(totalAvailable, amount)

  function adjustCredit(delta: number) {
    setCreditToApply((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next > maxCredit) return maxCredit
      return next
    })
  }

  const loadSquareScript = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (window.Square) {
        resolve()
        return
      }
      // Ensure the script tag exists
      if (!document.querySelector('script[src*="squarecdn"]')) {
        const script = document.createElement('script')
        script.src = 'https://web.squarecdn.com/v1/square.js'
        script.async = true
        document.head.appendChild(script)
      }
      const interval = setInterval(() => {
        if (window.Square) {
          clearInterval(interval)
          resolve()
        }
      }, 200)
      setTimeout(() => {
        clearInterval(interval)
        resolve()
      }, 15000)
    })
  }, [])

  const initializeCard = useCallback(async () => {
    if (!open) return
    // Reset previous state
    setInitFailed(false)
    setError(null)

    await loadSquareScript()

    if (!window.Square) {
      setError('Payment system failed to load. Please refresh and try again.')
      setInitFailed(true)
      return
    }

    try {
      initRef.current = true
      const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || ''
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ''

      if (!appId || !locationId) {
        throw new Error('Payment configuration missing')
      }

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

      // The container is always rendered (hidden via CSS when not needed)
      // Wait a moment for DOM to be fully ready
      await new Promise((r) => setTimeout(r, 100))

      const container = document.getElementById('sq-card-container')
      if (!container) {
        throw new Error('Card container not found')
      }

      await card.attach('#sq-card-container')
      cardRef.current = card
      setCardReady(true)
    } catch (err) {
      console.error('Square card init error:', err)
      setError('Failed to initialize payment form. Please try again.')
      setInitFailed(true)
      initRef.current = false
    }
  }, [open, loadSquareScript])

  // Retry handler
  const handleRetry = useCallback(() => {
    if (cardRef.current) {
      try { cardRef.current.destroy() } catch { /* ignore */ }
      cardRef.current = null
    }
    setCardReady(false)
    initRef.current = false
    setInitFailed(false)
    setError(null)
    // Wait for DOM update then initialize
    setTimeout(initializeCard, 500)
  }, [initializeCard])

  useEffect(() => {
    if (open) {
      setError(null)
      setSuccess(false)
      setInitFailed(false)
      // Wait for modal slide-in animation to complete (300ms) before initializing
      const timer = setTimeout(initializeCard, 500)
      return () => clearTimeout(timer)
    } else {
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
      setInitFailed(false)
    }
  }, [open, initializeCard])

  async function handlePay() {
    if (processing) return

    // If credit covers full amount, no card needed
    const needsCard = chargeAmount > 0

    if (needsCard && !cardRef.current) return

    setProcessing(true)
    setError(null)

    try {
      let sourceId: string | null = null

      if (needsCard) {
        const result = await cardRef.current!.tokenize()
        if (result.status !== 'OK' || !result.token) {
          const errMsg = result.errors?.[0]?.message || 'Card verification failed'
          setError(errMsg)
          setProcessing(false)
          return
        }
        sourceId = result.token
      }

      const res = await fetch('/api/square/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_id: sourceId,
          booking_id: bookingId,
          amount: chargeAmount,
          payment_type: paymentType,
          credit_amount: creditToApply > 0 ? creditToApply : undefined,
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
    } catch {
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Payment Successful!
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {creditToApply > 0 && chargeAmount > 0 ? (
                  <>
                    {formatCurrency(creditToApply)} credit applied + {formatCurrency(chargeAmount)} charged to your card.
                  </>
                ) : creditToApply > 0 ? (
                  <>
                    {formatCurrency(creditToApply)} credit applied. No card charge needed!
                  </>
                ) : (
                  <>
                    Your {paymentType === 'deposit' ? 'deposit' : 'payment'} of{' '}
                    {formatCurrency(amount)} has been processed.
                  </>
                )}
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

              {/* Review Credits Section */}
              {!loadingCredits && totalAvailable > 0 && (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      You have {formatCurrency(totalAvailable)} in review credits!
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-green-700">Apply credit:</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustCredit(-100)}
                        disabled={creditToApply <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-green-300 bg-white text-green-700 transition-colors hover:bg-green-100 disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[80px] text-center text-lg font-bold text-green-800">
                        {formatCurrency(creditToApply)}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustCredit(100)}
                        disabled={creditToApply >= maxCredit}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-green-300 bg-white text-green-700 transition-colors hover:bg-green-100 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Quick buttons */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreditToApply(0)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        creditToApply === 0
                          ? 'bg-green-700 text-white'
                          : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                      }`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditToApply(maxCredit)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        creditToApply === maxCredit
                          ? 'bg-green-700 text-white'
                          : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                      }`}
                    >
                      Use All ({formatCurrency(maxCredit)})
                    </button>
                  </div>

                  {/* Updated total */}
                  {creditToApply > 0 && (
                    <div className="mt-3 border-t border-green-200 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700">Credit discount:</span>
                        <span className="font-medium text-green-700">-{formatCurrency(creditToApply)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-900">Amount to charge:</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(chargeAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Card Form — ALWAYS rendered, hidden via CSS when credit covers full amount */}
              <div className="space-y-4">
                {chargeAmount === 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                    <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      Your credits cover the full amount!
                    </p>
                    <p className="mt-1 text-xs text-green-600">No card payment needed.</p>
                  </div>
                )}

                {/* Always keep the card container in the DOM so Square doesn't lose its reference */}
                <div className={chargeAmount === 0 ? 'hidden' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Card Details
                  </label>
                  <div
                    id="sq-card-container"
                    className="min-h-[130px] rounded-lg border border-gray-200 bg-white p-1"
                  >
                    {!cardReady && !initFailed && (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="ml-2 text-sm text-gray-400">
                          Loading payment form...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error with retry button */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    {initFailed && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-2 flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                  </div>
                )}

                {/* Pay Button */}
                <Button
                  onClick={handlePay}
                  disabled={(chargeAmount > 0 && !cardReady) || processing}
                  className="w-full py-6 text-base font-semibold"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : chargeAmount > 0 ? (
                    <>Pay {formatCurrency(chargeAmount)}{creditToApply > 0 ? ` + ${formatCurrency(creditToApply)} credit` : ''}</>
                  ) : (
                    <>Apply {formatCurrency(creditToApply)} Credit</>
                  )}
                </Button>

                {/* Security Note */}
                {chargeAmount > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <Lock className="h-3 w-3" />
                    <span>Secured by Square. Your card info never touches our servers.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
