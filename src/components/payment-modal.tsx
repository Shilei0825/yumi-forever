'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, CreditCard, Loader2, CheckCircle, AlertCircle, Lock, Gift, Minus, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<any>
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null)
  const [cardReady, setCardReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const initRef = useRef(false)
  const [initFailed, setInitFailed] = useState(false)

  // Billing details
  const [billingName, setBillingName] = useState('')
  const [billingZip, setBillingZip] = useState('')

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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCreditToApply(0)
      setCredits([])
      setTotalAvailable(0)
      setBillingName('')
      setBillingZip('')
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

  // Initialize card form — only depends on open + loadSquareScript (stable refs)
  const initializePayments = useCallback(async () => {
    if (!open || initRef.current) return
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

      await card.attach('#sq-card-container')
      cardRef.current = card
      setCardReady(true)
    } catch (err: unknown) {
      console.error('Square init error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Payment form error: ${msg}`)
      setInitFailed(true)
      initRef.current = false
    }
  }, [open, loadSquareScript])

  const handleRetry = useCallback(() => {
    if (cardRef.current) {
      try { cardRef.current.destroy() } catch { /* ignore */ }
      cardRef.current = null
    }
    setCardReady(false)
    initRef.current = false
    setInitFailed(false)
    setError(null)
    requestAnimationFrame(() => initializePayments())
  }, [initializePayments])

  useEffect(() => {
    if (open) {
      setError(null)
      setSuccess(false)
      setInitFailed(false)
      const raf = requestAnimationFrame(() => initializePayments())
      return () => cancelAnimationFrame(raf)
    } else {
      if (cardRef.current) {
        try { cardRef.current.destroy() } catch { /* ignore */ }
        cardRef.current = null
      }
      setCardReady(false)
      initRef.current = false
      setInitFailed(false)
    }
  }, [open, initializePayments])

  // --- Payment handler ---
  async function processPayment(sourceId: string | null) {
    setProcessing(true)
    setError(null)

    try {
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
      setTimeout(() => onSuccess(data), 1500)
    } catch {
      setError('Payment failed. Please check your details and try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCardPay() {
    if (processing) return

    const needsCard = chargeAmount > 0
    if (needsCard && !cardRef.current) return

    if (needsCard) {
      if (!billingName.trim()) {
        setError('Please enter the name on your card.')
        return
      }
      if (!billingZip.trim()) {
        setError('Please enter your billing zip code.')
        return
      }

      setProcessing(true)
      setError(null)

      const [givenName, ...rest] = billingName.trim().split(' ')
      const familyName = rest.join(' ')

      const tokenResult = await cardRef.current!.tokenize({
        billingContact: {
          givenName,
          familyName: familyName || undefined,
          postalCode: billingZip.trim(),
          email: customerEmail,
        },
      })

      if (tokenResult.status !== 'OK' || !tokenResult.token) {
        const errMsg = tokenResult.errors?.[0]?.message || 'Card verification failed'
        setError(errMsg)
        setProcessing(false)
        return
      }

      setProcessing(false)
      await processPayment(tokenResult.token)
    } else {
      // Credit-only payment
      await processPayment(null)
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
                    {formatCurrency(creditToApply)} credit applied + {formatCurrency(chargeAmount)} charged.
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

                {/* Card Form — always in DOM, hidden when credits cover full amount */}
                <div className={chargeAmount === 0 ? 'hidden' : 'space-y-4'}>
                  {/* Billing Name */}
                  <Input
                    label="Name on Card"
                    placeholder="John Doe"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                  />

                  {/* Card fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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

                  {/* Billing Zip */}
                  <Input
                    label="Billing Zip Code"
                    placeholder="10001"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    className="max-w-[180px]"
                  />
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
                  onClick={handleCardPay}
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
