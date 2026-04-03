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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applePayRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googlePayRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentsRef = useRef<any>(null)

  const [cardReady, setCardReady] = useState(false)
  const [applePayReady, setApplePayReady] = useState(false)
  const [googlePayReady, setGooglePayReady] = useState(false)
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
  const chargeAmountDollars = (chargeAmount / 100).toFixed(2)

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
      paymentsRef.current = payments

      // --- Card form ---
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

      // --- Google Pay (no domain verification needed) ---
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: chargeAmountDollars, label: 'Total' },
        })
        const googlePay = await payments.googlePay(paymentRequest)
        await googlePay.attach('#sq-google-pay-sdk')
        googlePayRef.current = googlePay
        setGooglePayReady(true)
      } catch {
        // Google Pay not available on this browser/device
      }

      // --- Apple Pay (requires domain verification) ---
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: { amount: chargeAmountDollars, label: 'Total' },
        })
        const applePay = await payments.applePay(paymentRequest)
        applePayRef.current = applePay
        setApplePayReady(true)
      } catch {
        // Apple Pay not available (not Safari, or domain not verified)
      }
    } catch (err: unknown) {
      console.error('Square init error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Payment form error: ${msg}`)
      setInitFailed(true)
      initRef.current = false
    }
  }, [open, loadSquareScript, chargeAmountDollars])

  const handleRetry = useCallback(() => {
    if (cardRef.current) {
      try { cardRef.current.destroy() } catch { /* ignore */ }
      cardRef.current = null
    }
    if (googlePayRef.current) {
      try { googlePayRef.current.destroy() } catch { /* ignore */ }
      googlePayRef.current = null
    }
    if (applePayRef.current) {
      try { applePayRef.current.destroy() } catch { /* ignore */ }
      applePayRef.current = null
    }
    setCardReady(false)
    setGooglePayReady(false)
    setApplePayReady(false)
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
      if (googlePayRef.current) {
        try { googlePayRef.current.destroy() } catch { /* ignore */ }
        googlePayRef.current = null
      }
      if (applePayRef.current) {
        try { applePayRef.current.destroy() } catch { /* ignore */ }
        applePayRef.current = null
      }
      paymentsRef.current = null
      setCardReady(false)
      setGooglePayReady(false)
      setApplePayReady(false)
      initRef.current = false
      setInitFailed(false)
    }
  }, [open, initializePayments])

  // --- Payment handler (shared for card, Apple Pay, Google Pay) ---
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

  // Card pay
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

  // Google Pay
  async function handleGooglePay() {
    if (processing || !googlePayRef.current) return
    setError(null)

    try {
      const tokenResult = await googlePayRef.current.tokenize()
      if (tokenResult.status === 'OK' && tokenResult.token) {
        await processPayment(tokenResult.token)
      } else {
        setError('Google Pay was cancelled or failed.')
      }
    } catch {
      setError('Google Pay failed. Please try another method.')
    }
  }

  // Apple Pay
  async function handleApplePay() {
    if (processing || !applePayRef.current) return
    setError(null)

    try {
      const tokenResult = await applePayRef.current.tokenize()
      if (tokenResult.status === 'OK' && tokenResult.token) {
        await processPayment(tokenResult.token)
      } else {
        setError('Apple Pay was cancelled or failed.')
      }
    } catch {
      setError('Apple Pay failed. Please try another method.')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Hidden container for Google Pay SDK initialization */}
      <div id="sq-google-pay-sdk" style={{ position: 'fixed', top: -9999, left: -9999, width: 400, height: 48 }} aria-hidden />

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

                {/* Digital Wallet Buttons — hidden when credits cover full amount */}
                <div className={chargeAmount === 0 ? 'hidden' : 'space-y-3'}>
                  {/* Apple Pay button */}
                  {applePayReady && (
                    <button
                      type="button"
                      onClick={handleApplePay}
                      disabled={processing}
                      className="flex h-12 w-full items-center justify-center rounded-lg bg-black text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ WebkitAppearance: 'none' }}
                    >
                      <svg viewBox="0 0 165.521 40" className="h-5" fill="white">
                        <path d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.932 9.932 0 0 0-4.35 4.35 10.463 10.463 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a69.674 69.674 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v10.354c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.275 3.11a10.46 10.46 0 0 0 .974 2.96 9.897 9.897 0 0 0 1.83 2.52 9.874 9.874 0 0 0 2.52 1.83c.947.483 1.917.79 2.96.977 1.025.183 2.073.245 3.112.273.477.011.953.017 1.43.02.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.003.954-.009 1.431-.02 1.037-.028 2.085-.09 3.113-.273a10.478 10.478 0 0 0 2.958-.977 9.955 9.955 0 0 0 4.35-4.35c.483-.947.789-1.917.974-2.96.186-1.026.246-2.074.274-3.11.013-.477.02-.954.022-1.43.004-.567.004-1.132.004-1.699V14.824c0-.567 0-1.133-.004-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.088-2.085-.274-3.112a10.4 10.4 0 0 0-.974-2.96 9.94 9.94 0 0 0-4.35-4.35A10.52 10.52 0 0 0 156.939.3c-1.028-.185-2.076-.246-3.113-.274a71.417 71.417 0 0 0-1.431-.022C151.83 0 151.263 0 150.698 0z" />
                        <path fill="black" d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.021.793.022 1.719.064 2.583.22.75.136 1.38.352 1.966.648a6.392 6.392 0 0 1 2.795 2.795c.296.585.51 1.215.647 1.966.157.865.199 1.79.22 2.584.013.452.018.905.021 1.36.004.564.004 1.127.004 1.694v10.354c0 .564 0 1.13-.004 1.694a68.26 68.26 0 0 1-.021 1.36c-.021.793-.063 1.719-.22 2.584a6.62 6.62 0 0 1-.647 1.966 6.385 6.385 0 0 1-2.795 2.795 6.588 6.588 0 0 1-1.966.648c-.864.156-1.79.197-2.583.22-.455.012-.908.017-1.36.02-.565.004-1.13.004-1.672.004H14.823c-.536 0-1.106 0-1.672-.004a65.43 65.43 0 0 1-1.36-.02c-.793-.023-1.718-.064-2.584-.22a6.602 6.602 0 0 1-1.966-.648 6.389 6.389 0 0 1-2.795-2.795 6.587 6.587 0 0 1-.647-1.966c-.157-.865-.199-1.79-.22-2.584a64.937 64.937 0 0 1-.022-1.36c-.004-.564-.004-1.13-.004-1.694V14.824c0-.567 0-1.13.004-1.694a65.26 65.26 0 0 1 .022-1.36c.021-.793.063-1.719.22-2.584.135-.75.352-1.38.647-1.966a6.39 6.39 0 0 1 2.795-2.795 6.608 6.608 0 0 1 1.966-.648c.866-.157 1.79-.198 2.584-.22.455-.013.905-.018 1.36-.021.566-.004 1.136-.003 1.672-.003z" />
                        <path fill="white" d="M43.508 26.132a5.49 5.49 0 0 1-2.803-4.844c0-3.038 2.086-4.795 2.086-4.795a5.26 5.26 0 0 0-4.144-2.247c-1.774-.178-3.455 1.043-4.354 1.043-.897 0-2.282-1.017-3.75-.99a5.526 5.526 0 0 0-4.65 2.834c-1.98 3.44-.506 8.53 1.425 11.32.944 1.365 2.07 2.9 3.548 2.844 1.424-.057 1.962-.92 3.683-.92 1.724 0 2.21.92 3.717.892 1.532-.028 2.508-1.392 3.448-2.758a12.14 12.14 0 0 0 1.562-3.206 5.309 5.309 0 0 1-2.768-3.173zm-3.282-11.436c.784-.952 1.312-2.273 1.168-3.593-1.128.046-2.494.752-3.302 1.7-.724.84-1.358 2.18-1.188 3.467 1.258.098 2.54-.64 3.322-1.574zM60.44 31.936h-2.269l-1.243-3.903h-4.318l-1.183 3.903h-2.21l4.275-13.297h2.647zm-3.89-5.558l-1.109-3.426c-.117-.352-.337-1.172-.66-2.463h-.038c-.132.55-.34 1.37-.623 2.463l-1.089 3.426zM75.112 27.22c0 1.564-.423 2.8-1.267 3.706-.76.812-1.704 1.218-2.833 1.218-1.217 0-2.09-.438-2.62-1.313v4.872h-2.153V25.757c0-.984-.026-1.993-.078-3.028h1.893l.12 1.46h.038c.678-1.1 1.694-1.65 3.048-1.65 1.09 0 1.997.425 2.725 1.276.726.85 1.09 1.97 1.09 3.357v.047zm-2.192.078c0-.904-.204-1.653-.612-2.247-.447-.614-1.047-.922-1.8-.922-.51 0-.974.17-1.388.508-.415.34-.683.783-.806 1.33a2.43 2.43 0 0 0-.078.59v1.558c0 .676.21 1.247.63 1.714.42.467.966.7 1.64.7.786 0 1.396-.306 1.83-.917.436-.612.653-1.426.653-2.442v.128zm12.226-.078c0 1.564-.422 2.8-1.267 3.706-.76.812-1.704 1.218-2.833 1.218-1.217 0-2.09-.438-2.62-1.313v4.872h-2.152V25.757c0-.984-.027-1.993-.078-3.028h1.893l.12 1.46h.037c.68-1.1 1.695-1.65 3.05-1.65 1.088 0 1.996.425 2.723 1.276.727.85 1.09 1.97 1.09 3.357v.047zm-2.19.078c0-.904-.205-1.653-.613-2.247-.447-.614-1.047-.922-1.8-.922-.51 0-.975.17-1.39.508-.413.34-.682.783-.805 1.33a2.39 2.39 0 0 0-.078.59v1.558c0 .676.21 1.247.632 1.714.42.467.964.7 1.638.7.787 0 1.397-.306 1.83-.917.435-.612.653-1.426.653-2.442v.128zm16.83 1.07c0 1.086-.378 1.97-1.134 2.652-.83.745-1.99 1.117-3.477 1.117-1.378 0-2.484-.268-3.318-.805l.477-1.794c.897.558 1.882.836 2.958.836.786 0 1.397-.178 1.83-.534.435-.355.652-.832.652-1.427 0-.534-.184-.983-.553-1.35-.368-.365-1.003-.706-1.905-1.023-2.418-.872-3.627-2.146-3.627-3.822 0-1.047.393-1.907 1.178-2.58.784-.672 1.83-1.008 3.138-1.008 1.163 0 2.132.203 2.908.608l-.517 1.756c-.723-.385-1.54-.578-2.45-.578-.737 0-1.312.18-1.725.54a1.634 1.634 0 0 0-.535 1.254c0 .515.202.94.607 1.275.355.294 1.026.636 2.013 1.024 1.193.47 2.073 1.02 2.64 1.648.567.628.85 1.413.85 2.354v.057zm6.424-4.246h-2.37v4.595c0 1.168.41 1.752 1.228 1.752.377 0 .69-.033.94-.097l.058 1.635c-.417.157-.965.235-1.643.235-.835 0-1.487-.255-1.957-.765-.47-.508-.706-1.363-.706-2.564v-4.79h-1.414v-1.617h1.414v-1.775l2.112-.638v2.413h2.37v1.617h-.032zm9.4 3.098c0 1.406-.402 2.56-1.207 3.463-.844.924-1.967 1.386-3.367 1.386-1.342 0-2.413-.44-3.216-1.322-.803-.882-1.204-2.005-1.204-3.372 0-1.417.41-2.578 1.232-3.482.82-.904 1.934-1.356 3.342-1.356 1.342 0 2.423.44 3.244 1.322.774.86 1.176 1.976 1.176 3.36zm-2.23.068c0-.843-.182-1.567-.547-2.17-.428-.73-1.04-1.095-1.838-1.095-.824 0-1.445.365-1.874 1.095-.365.604-.548 1.34-.548 2.21 0 .842.183 1.567.548 2.17.44.73 1.057 1.095 1.854 1.095.783 0 1.396-.374 1.838-1.117.375-.624.567-1.353.567-2.188zm8.84-2.867c-.213-.04-.446-.058-.696-.058-.73 0-1.296.276-1.696.828-.35.486-.524 1.1-.524 1.843v5.505h-2.152l.02-7.183c0-1.207-.028-2.306-.08-3.297h1.876l.078 2.002h.065c.22-.69.566-1.244 1.036-1.664a2.502 2.502 0 0 1 1.504-.516c.207 0 .393.014.557.04v2.5h.012zm8.156 2.578c0 .362-.024.666-.078.917h-6.463c.025.898.318 1.584.878 2.058.51.426 1.172.64 1.983.64.898 0 1.716-.144 2.455-.43l.315 1.498c-.862.376-1.882.564-3.058.564-1.415 0-2.526-.415-3.334-1.248-.808-.832-1.212-1.948-1.212-3.348 0-1.378.377-2.526 1.134-3.444.793-.983 1.863-1.474 3.213-1.474 1.327 0 2.33.49 3.014 1.474.54.776.81 1.735.81 2.877v-.084zm-2.055-.528c.014-.597-.118-1.113-.398-1.547-.357-.558-.905-.837-1.643-.837-.676 0-1.226.272-1.644.815-.34.434-.544.957-.608 1.57h4.293z" />
                      </svg>
                    </button>
                  )}

                  {/* Google Pay — custom button (SDK button renders white/broken) */}
                  {googlePayReady && (
                    <button
                      type="button"
                      onClick={handleGooglePay}
                      disabled={processing}
                      className="flex h-12 w-full items-center justify-center gap-1 rounded-lg bg-white border border-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg viewBox="0 0 41 17" className="h-[17px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.997-2.583.997h-2.485z" fill="#5F6368"/>
                        <path d="M27.194 10.442c0 .544.202 1.018.605 1.422.403.413.9.62 1.49.62.588 0 1.08-.207 1.477-.62.403-.404.604-.878.604-1.422V8.785c-.382.31-.887.464-1.517.464-.676 0-1.24.186-1.692.558-.456.371-.684.853-.684 1.446l-.283-.811zm4.176 4.431V13.99c-.65.622-1.457.932-2.42.932-1.015 0-1.875-.344-2.584-1.034-.697-.691-1.046-1.558-1.046-2.6 0-1.06.36-1.926 1.08-2.6.72-.675 1.612-1.012 2.671-1.012.856 0 1.563.24 2.12.72v-.54c0-.665-.233-1.208-.698-1.627-.465-.42-1.057-.63-1.774-.63-.955 0-1.692.413-2.213 1.237l-1.178-.72c.752-1.148 1.882-1.722 3.39-1.722 1.114 0 2.02.32 2.716.963.697.643 1.046 1.504 1.046 2.583v6.933h-1.11z" fill="#5F6368"/>
                        <path d="M35.49 14.873l-3.008-7.963h1.578l2.186 5.905 2.164-5.905h1.578l-3.536 9.41c-.594 1.573-1.426 2.36-2.494 2.36-.465 0-.852-.063-1.163-.186v-1.237c.31.124.665.186 1.064.186.596 0 1.038-.376 1.324-1.128l.307-.754v-.688z" fill="#5F6368"/>
                        <path d="M13.986 7.173c0-.429-.036-.843-.106-1.238H7.142v2.344h3.834a3.28 3.28 0 01-1.424 2.153v1.79h2.305c1.35-1.243 2.129-3.073 2.129-5.049z" fill="#4285F4"/>
                        <path d="M7.142 12.994c1.929 0 3.545-.64 4.728-1.733l-2.305-1.79c-.64.428-1.457.68-2.423.68-1.862 0-3.44-1.258-4.005-2.95H.76v1.846c1.174 2.327 3.587 3.947 6.382 3.947z" fill="#34A853"/>
                        <path d="M3.137 7.201a4.306 4.306 0 010-2.744V2.611H.76a7.15 7.15 0 000 6.436l2.377-1.846z" fill="#FBBC04"/>
                        <path d="M7.142 2.507c1.05 0 1.994.361 2.736 1.07l2.053-2.053C10.682.582 9.066-.07 7.142-.07c-2.795 0-5.208 1.62-6.382 3.947l2.377 1.847c.565-1.693 2.143-2.95 4.005-2.95v-.267z" fill="#EA4335"/>
                      </svg>
                    </button>
                  )}

                  {(applePayReady || googlePayReady) && (
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs text-gray-400">or pay with card</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                  )}
                </div>

                {/* Card Form — always in DOM */}
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
