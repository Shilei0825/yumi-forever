'use client'

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Loader2,
  CreditCard,
  Minus,
  Plus,
  Zap,
  Crown,
  CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from '@/components/payment-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatTime } from '@/lib/utils'
import {
  SERVICES,
  VEHICLE_TYPES,
  ADDONS,
  TIME_SLOTS,
  TAX_RATE,
  calculateTravelFee,
  type VehicleType,
} from '@/lib/constants'
import type { ServiceDefinition } from '@/lib/constants'
import { PriceAppealDialog } from '@/components/price-appeal-dialog'
import { ConfidenceBar } from '@/components/ui/confidence-bar'
import { getAutoPriceConfidence } from '@/lib/pricing-engine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingState {
  service: ServiceDefinition | null
  vehicleType: VehicleType | ''
  addons: string[] // addon IDs
  addonQuantities: Record<string, number> // addon ID -> quantity (for quantifiable add-ons)
  date: string
  timeSlot: string
  street: string
  unit: string
  city: string
  state: string
  zipCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  specialNotes: string
  consentChecked: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 6

const STEP_LABELS = [
  'Service',
  'Vehicle',
  'Add-ons',
  'Date & Time',
  'Your Details',
  'Review',
]

const INITIAL_STATE: BookingState = {
  service: null,
  vehicleType: '',
  addons: [],
  addonQuantities: {},
  date: '',
  timeSlot: '',
  street: '',
  unit: '',
  city: '',
  state: 'NY',
  zipCode: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  specialNotes: '',
  consentChecked: false,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function getServicePrice(service: ServiceDefinition, vehicleType: VehicleType): number {
  return service.pricing[vehicleType]
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  currentStep,
  maxReachedStep,
  onStepClick,
}: {
  currentStep: number
  maxReachedStep: number
  onStepClick: (step: number) => void
}) {
  return (
    <div className="w-full">
      {/* Mobile: current step label + numbered dots */}
      <div className="sm:hidden">
        <p className="mb-3 text-center text-sm font-medium text-gray-900">
          Step {currentStep}: {STEP_LABELS[currentStep - 1]}
        </p>
        <div className="flex items-center justify-center gap-2">
          {STEP_LABELS.map((_, i) => {
            const stepNum = i + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep
            const isClickable = stepNum <= maxReachedStep
            return (
              <button
                key={stepNum}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(stepNum)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isCurrent
                    ? 'bg-primary text-white'
                    : isCompleted
                      ? 'bg-primary/15 text-primary'
                      : isClickable
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-gray-50 text-gray-300'
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: full pill labels */}
      <div className="hidden gap-1 sm:flex">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isClickable = stepNum <= maxReachedStep

          return (
            <button
              key={stepNum}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(stepNum)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isCurrent
                  ? 'bg-primary text-white'
                  : isCompleted
                    ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                    : isClickable
                      ? 'bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : isCompleted
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
              </span>
              {label}
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1
          return (
            <div
              key={stepNum}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                stepNum <= currentStep ? 'bg-primary' : 'bg-gray-200'
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function BookingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [expandedTier, setExpandedTier] = useState<'express' | 'premium' | null>(null)
  const [booking, setBooking] = useState<BookingState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingBookingId, setPendingBookingId] = useState('')
  const [pendingAmount, setPendingAmount] = useState(0)
  const [depositRequired, setDepositRequired] = useState<boolean | null>(null)
  const [depositReason, setDepositReason] = useState('')
  const [checkingDeposit, setCheckingDeposit] = useState(false)

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // Navigation
  const goNext = useCallback(() => {
    setStep((s) => {
      const next = Math.min(s + 1, TOTAL_STEPS)
      setMaxReachedStep((prev) => Math.max(prev, next))
      return next
    })
  }, [])
  const goBack = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])
  const goToStep = useCallback((target: number) => {
    if (target >= 1 && target <= maxReachedStep) {
      setStep(target)
    }
  }, [maxReachedStep])

  const updateBooking = useCallback(
    <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
      setBooking((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  // Redirect to category-specific booking pages
  useEffect(() => {
    const category = searchParams.get('category')
    if (category === 'home_care') {
      router.replace('/book/home')
      return
    }
    if (category === 'office') {
      router.replace('/book/office')
      return
    }
  }, [searchParams, router])

  // Pre-fill from URL params: ?service=slug
  useEffect(() => {
    const slug = searchParams.get('service')
    if (slug) {
      const found = SERVICES.find((s) => s.slug === slug)
      if (found) {
        setBooking((prev) => ({ ...prev, service: found }))
        setStep(2)
        setMaxReachedStep(2)
      }
    }
  }, [searchParams])

  // Pre-fill customer info if logged in
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .single()
          if (profile) {
            setBooking((prev) => ({
              ...prev,
              customerName: profile.full_name || '',
              customerEmail: profile.email || user.email || '',
              customerPhone: profile.phone || '',
            }))
          }
        }
      } catch {
        // Not logged in — that is fine
      }
    }
    loadUser()
  }, [])

  // ----- Pricing calculations -----

  const servicePrice = useMemo(() => {
    if (!booking.service || !booking.vehicleType) return 0
    return getServicePrice(booking.service, booking.vehicleType as VehicleType)
  }, [booking.service, booking.vehicleType])

  const getAddonPrice = useCallback((addon: typeof ADDONS[number]) => {
    if (addon.quoteOnly || !booking.vehicleType) return 0
    return addon.pricing[booking.vehicleType as VehicleType] || 0
  }, [booking.vehicleType])

  const getAddonQuantity = useCallback((addonId: string) => {
    return booking.addonQuantities[addonId] || 1
  }, [booking.addonQuantities])

  const addonTotal = useMemo(() => {
    return booking.addons.reduce((sum, id) => {
      const addon = ADDONS.find((a) => a.id === id)
      if (!addon) return sum
      const qty = addon.quantifiable ? getAddonQuantity(id) : 1
      return sum + getAddonPrice(addon) * qty
    }, 0)
  }, [booking.addons, getAddonPrice, getAddonQuantity])

  // ----- AI analysis state -----
  const [aiPriceAdjustment, setAiPriceAdjustment] = useState(0)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiFactors, setAiFactors] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const travelFee = useMemo(() => {
    if (!booking.zipCode || booking.zipCode.length < 5) return { zone: 'local' as const, label: '', fee: 0, breakdown: '' }
    return calculateTravelFee(booking.zipCode.trim())
  }, [booking.zipCode])

  const aiAdjustedServicePrice = aiPriceAdjustment !== 0
    ? Math.round(servicePrice * (1 + aiPriceAdjustment / 100))
    : servicePrice
  const subtotal = aiAdjustedServicePrice + addonTotal + travelFee.fee
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  // Debounced Gemini analysis when special notes change
  useEffect(() => {
    if (!booking.specialNotes || booking.specialNotes.trim().length < 10) {
      setAiPriceAdjustment(0)
      setAiSuggestion('')
      setAiFactors([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      try {
        const res = await fetch('/api/analyze-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'auto_care',
            notes: booking.specialNotes,
            vehicleType: booking.vehicleType,
            serviceType: booking.service?.slug || '',
            condition: '',
          }),
        })
        const data = await res.json()
        setAiPriceAdjustment(data.priceAdjustmentPercent || 0)
        setAiSuggestion(data.suggestion || '')
        setAiFactors(data.factors || [])
      } catch {
        // AI analysis is optional
      } finally {
        setAiLoading(false)
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [booking.specialNotes, booking.vehicleType, booking.service])

  // ----- Price confidence -----
  const priceConfidence = useMemo(() => {
    return getAutoPriceConfidence({
      hasVehicleType: !!booking.vehicleType,
      hasServiceType: !!booking.service,
      hasCondition: true, // auto form doesn't have separate condition step — always true
      hasAddons: true, // add-ons step is always visited
    })
  }, [booking.vehicleType, booking.service])

  // ----- Validation helpers -----

  function validateSchedule(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.date) errs.date = 'Please select a date'
    if (!booking.timeSlot) errs.timeSlot = 'Please select a time slot'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateDetails(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.street.trim()) errs.street = 'Street address is required'
    if (!booking.city.trim()) errs.city = 'City is required'
    if (!booking.state.trim() || booking.state.trim().length < 2) errs.state = 'State is required'
    if (!booking.zipCode.trim()) errs.zipCode = 'Zip code is required'
    else if (!/^\d{5}$/.test(booking.zipCode.trim())) errs.zipCode = 'Enter a valid 5-digit zip code'
    if (!booking.customerName.trim()) errs.customerName = 'Your name is required'
    if (!booking.customerEmail.trim()) errs.customerEmail = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customerEmail.trim())) errs.customerEmail = 'Enter a valid email'
    if (!booking.customerPhone.trim()) errs.customerPhone = 'Phone number is required'
    else if (!/^[\d\s()+-]{10,}$/.test(booking.customerPhone.trim())) errs.customerPhone = 'Enter a valid phone number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ----- Toggle add-on -----
  function toggleAddon(addonId: string) {
    setBooking((prev) => ({
      ...prev,
      addons: prev.addons.includes(addonId)
        ? prev.addons.filter((id) => id !== addonId)
        : [...prev.addons, addonId],
    }))
  }

  function setAddonQuantity(addonId: string, qty: number) {
    setBooking((prev) => ({
      ...prev,
      addonQuantities: { ...prev.addonQuantities, [addonId]: Math.max(1, qty) },
    }))
  }

  // Check if an add-on is already included in the selected service
  function isAddonIncluded(addonId: string): boolean {
    if (!booking.service) return false
    const addon = ADDONS.find((a) => a.id === addonId)
    if (!addon?.includedIn) return false
    return addon.includedIn.includes(booking.service.slug)
  }

  // ----- Submit -----
  async function handleSubmit() {
    if (!booking.consentChecked) {
      setSubmitError('Please agree to the service terms before continuing.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        service_slug: booking.service?.slug,
        category: 'auto_care',
        customer_name: booking.customerName.trim(),
        customer_email: booking.customerEmail.trim(),
        customer_phone: booking.customerPhone.trim(),
        scheduled_date: booking.date,
        scheduled_time: booking.timeSlot,
        estimated_duration: booking.service?.duration || 0,
        subtotal,
        tax,
        total,
        deposit_amount: depositRequired ? (booking.service?.depositAmount || 0) : 0,
        deposit_waived: !depositRequired,
        street: booking.street.trim(),
        unit: booking.unit.trim() || null,
        city: booking.city.trim(),
        state: booking.state.trim(),
        zip_code: booking.zipCode.trim(),
        vehicle_class: booking.vehicleType,
        auto_service_type: booking.service?.slug || null,
        special_instructions: booking.specialNotes.trim() || null,
        price_confidence: priceConfidence.percent,
        addons: booking.addons.map((id) => {
          const addon = ADDONS.find((a) => a.id === id)
          const price = addon ? getAddonPrice(addon) : 0
          const qty = addon?.quantifiable ? getAddonQuantity(id) : 1
          return { id, name: addon?.name || id, price, quantity: qty }
        }),
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create booking. Please try again.')
      }

      const data = await res.json()
      if (data.deposit_amount > 0) {
        // Show payment slide-in
        setPendingBookingId(data.booking_id)
        setPendingAmount(data.deposit_amount)
        setShowPayment(true)
      } else {
        router.push(`/booking-confirmation?booking_id=${data.booking_id}`)
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="min-h-screen bg-neutral-50 pb-mobile-cta">
      <div className={cn("mx-auto px-5 py-8 sm:px-6 sm:py-12 lg:px-8", step === 1 ? "max-w-4xl" : "max-w-2xl")}>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Book Your Detail
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Mobile auto detailing, delivered to your door.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={step} maxReachedStep={maxReachedStep} onStepClick={goToStep} />
        </div>

        {/* ================================================================= */}
        {/* STEP 1 -- Choose Service */}
        {/* ================================================================= */}
        {step === 1 && (
          <div>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Choose a service
            </h2>

            <div className="space-y-4">
              {/* Express Tier */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedTier(expandedTier === 'express' ? null : 'express')}
                  className={cn(
                    'w-full flex items-center justify-between rounded-2xl border bg-white p-5 transition-colors',
                    expandedTier === 'express' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Express</h3>
                      <p className="text-sm text-gray-500">(Quick service, under 90 min — wash, vacuum, basic care)</p>
                    </div>
                  </div>
                  <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform duration-200', expandedTier === 'express' && 'rotate-180')} />
                </button>

                {/* Express plans */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: expandedTier === 'express' ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3 space-y-3">
                      {SERVICES.filter((s) => s.tier === 'express').map((svc) => {
                        const isSelected = booking.service?.slug === svc.slug
                        return (
                          <div
                            key={svc.slug}
                            className={cn(
                              'cursor-pointer rounded-2xl border bg-white p-4 transition-colors',
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                            onClick={() => {
                              updateBooking('service', svc)
                              goNext()
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{svc.description}</p>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    ~{svc.duration} min
                                  </span>
                                  <span>From {formatCurrency(svc.pricing.sedan)}</span>
                                </div>
                              </div>
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300">
                                {isSelected && (
                                  <div className="h-3 w-3 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Tier */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedTier(expandedTier === 'premium' ? null : 'premium')}
                  className={cn(
                    'w-full flex items-center justify-between rounded-2xl border bg-white p-5 transition-colors',
                    expandedTier === 'premium' ? 'border-violet-300 ring-1 ring-violet-200' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <Crown className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Premium</h3>
                      <p className="text-sm text-gray-500">(Deep detail, 2–5 hrs — polish, clay bar, steam extraction)</p>
                    </div>
                  </div>
                  <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform duration-200', expandedTier === 'premium' && 'rotate-180')} />
                </button>

                {/* Premium plans */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: expandedTier === 'premium' ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="pt-3 space-y-3">
                      {SERVICES.filter((s) => s.tier === 'premium').map((svc) => {
                        const isSelected = booking.service?.slug === svc.slug
                        return (
                          <div
                            key={svc.slug}
                            className={cn(
                              'cursor-pointer rounded-2xl border bg-white p-4 transition-colors',
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                            onClick={() => {
                              updateBooking('service', svc)
                              goNext()
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                                  {svc.popular && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{svc.description}</p>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    ~{svc.duration} min
                                  </span>
                                  <span>From {formatCurrency(svc.pricing.sedan)}</span>
                                </div>
                              </div>
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300">
                                {isSelected && (
                                  <div className="h-3 w-3 rounded-full bg-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2 -- Select Vehicle Type */}
        {/* ================================================================= */}
        {step === 2 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Select your vehicle type
            </h2>

            <div className="space-y-3">
              {VEHICLE_TYPES.map((vt) => {
                const isSelected = booking.vehicleType === vt.key
                const price = booking.service
                  ? getServicePrice(booking.service, vt.key)
                  : 0
                return (
                  <div
                    key={vt.key}
                    className={cn(
                      'cursor-pointer rounded-lg border bg-white p-5 transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => {
                      updateBooking('vehicleType', vt.key)
                      goNext()
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{vt.label}</h3>
                        <p className="mt-0.5 text-sm text-gray-500">{vt.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 -- Add-ons */}
        {/* ================================================================= */}
        {step === 3 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Add-ons
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Enhance your detail with optional extras.
            </p>

            <div className="space-y-3">
              {ADDONS.map((addon) => {
                const included = isAddonIncluded(addon.id)

                // Already included in selected service
                if (included) {
                  return (
                    <div
                      key={addon.id}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{addon.name}</p>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                Included
                              </span>
                            </div>
                            {addon.description && (
                              <p className="mt-0.5 text-sm text-gray-500">{addon.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium text-emerald-600">$0</span>
                      </div>
                    </div>
                  )
                }

                // Quote-only add-ons
                if (addon.quoteOnly) {
                  return (
                    <div
                      key={addon.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{addon.name}</p>
                          {addon.description && (
                            <p className="mt-0.5 text-sm text-gray-500">{addon.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-400">
                          Contact for pricing
                        </span>
                      </div>
                    </div>
                  )
                }

                const isSelected = booking.addons.includes(addon.id)
                const qty = addon.quantifiable ? getAddonQuantity(addon.id) : 1
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      'rounded-lg border bg-white p-4 transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div
                      className="flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => toggleAddon(addon.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Toggle switch */}
                        <div
                          className={cn(
                            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                            isSelected ? 'bg-primary' : 'bg-gray-200'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                              isSelected ? 'translate-x-[22px]' : 'translate-x-0.5'
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{addon.name}</p>
                          {addon.description && (
                            <p className="mt-0.5 text-sm text-gray-500">{addon.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 shrink-0">
                        +{formatCurrency(getAddonPrice(addon) * qty)}
                        {addon.quantifiable && qty > 1 && (
                          <span className="ml-1 text-xs font-normal text-gray-400">({qty}x)</span>
                        )}
                      </span>
                    </div>

                    {/* Quantity selector for quantifiable add-ons */}
                    {addon.quantifiable && isSelected && (
                      <div className="mt-3 flex items-center gap-3 pl-14">
                        <span className="text-sm text-gray-600">How many {addon.quantityLabel || 'units'}?</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setAddonQuantity(addon.id, qty - 1) }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-gray-900">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setAddonQuantity(addon.id, qty + 1) }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatCurrency(getAddonPrice(addon))}/{addon.quantityLabel === 'panels' ? 'panel' : 'unit'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Special Notes */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Vehicle Details <span className="text-gray-400">(optional)</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Describe your vehicle&apos;s condition to improve quote accuracy.
              </p>
              <textarea
                rows={3}
                placeholder="E.g., leather interior with some stains, pet hair in back seat, tree sap on hood, smoke odor, aftermarket tint..."
                value={booking.specialNotes}
                onChange={(e) => updateBooking('specialNotes', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Quote Accuracy */}
            <div className="mt-6">
              <ConfidenceBar
                confidence={priceConfidence.percent}
                message={priceConfidence.message}
                aiSuggestion={aiSuggestion}
                aiFactors={aiFactors}
                aiLoading={aiLoading}
                tips={[
                  ...(!booking.vehicleType ? ['Select your vehicle type'] : []),
                  ...(!booking.service ? ['Choose a service'] : []),
                  ...(!booking.specialNotes.trim() ? ['Describe your vehicle condition for better accuracy'] : []),
                ]}
              />
            </div>

            {/* Running total */}
            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{booking.service?.name} ({VEHICLE_TYPES.find((v) => v.key === booking.vehicleType)?.label})</span>
                <span>{formatCurrency(servicePrice)}</span>
              </div>
              {aiPriceAdjustment !== 0 && (
                <div className={cn(
                  "flex items-center justify-between text-sm mt-1",
                  aiPriceAdjustment > 0 ? "text-amber-700" : "text-green-600"
                )}>
                  <span>AI adjustment ({aiPriceAdjustment > 0 ? '+' : ''}{aiPriceAdjustment}%)</span>
                  <span>{aiPriceAdjustment > 0 ? '+' : '-'}{formatCurrency(Math.abs(aiAdjustedServicePrice - servicePrice))}</span>
                </div>
              )}
              {booking.addons.length > 0 && (
                <div className="mt-2 space-y-1">
                  {booking.addons.map((id) => {
                    const addon = ADDONS.find((a) => a.id === id)
                    if (!addon) return null
                    const qty = addon.quantifiable ? getAddonQuantity(id) : 1
                    return (
                      <div key={id} className="flex items-center justify-between text-sm text-gray-600">
                        <span>{addon.name}{qty > 1 ? ` x${qty}` : ''}</span>
                        <span>+{formatCurrency(getAddonPrice(addon) * qty)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {travelFee.fee > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm text-amber-700">
                  <span>{travelFee.label}</span>
                  <span>+{formatCurrency(travelFee.fee)}</span>
                </div>
              )}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tax (8.75%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4 -- Date & Time */}
        {/* ================================================================= */}
        {step === 4 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Pick a date & time
            </h2>

            <div className="space-y-8">
              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <Input
                  type="date"
                  min={getTomorrowDate()}
                  value={booking.date}
                  onChange={(e) => updateBooking('date', e.target.value)}
                  error={errors.date}
                  className="max-w-xs"
                />
              </div>

              {/* Time grid */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Time
                </label>
                {errors.timeSlot && (
                  <p className="mb-2 text-sm text-red-600">{errors.timeSlot}</p>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                        booking.timeSlot === slot
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('timeSlot', slot)}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => { if (validateSchedule()) goNext() }}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 5 -- Your Details (Address + Contact) */}
        {/* ================================================================= */}
        {step === 5 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Your details
            </h2>

            {/* Contact Info */}
            <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wide">Contact</h3>
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={booking.customerName}
                onChange={(e) => updateBooking('customerName', e.target.value)}
                error={errors.customerName}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={booking.customerEmail}
                  onChange={(e) => updateBooking('customerEmail', e.target.value)}
                  error={errors.customerEmail}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={booking.customerPhone}
                  onChange={(e) => updateBooking('customerPhone', e.target.value)}
                  error={errors.customerPhone}
                />
              </div>
            </div>

            {/* Service Address */}
            <h3 className="mb-3 mt-8 text-sm font-medium text-gray-500 uppercase tracking-wide">Service Address</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-3">
                  <Input
                    label="Street Address"
                    placeholder="123 Main St"
                    value={booking.street}
                    onChange={(e) => updateBooking('street', e.target.value)}
                    error={errors.street}
                  />
                </div>
                <Input
                  label="Unit / Apt"
                  placeholder="Apt 4B"
                  value={booking.unit}
                  onChange={(e) => updateBooking('unit', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="City"
                  placeholder="New York"
                  value={booking.city}
                  onChange={(e) => updateBooking('city', e.target.value)}
                  error={errors.city}
                />
                <Input
                  label="State"
                  placeholder="NY"
                  value={booking.state}
                  onChange={(e) => updateBooking('state', e.target.value)}
                  error={errors.state}
                />
                <Input
                  label="Zip Code"
                  placeholder="10001"
                  value={booking.zipCode}
                  onChange={(e) => updateBooking('zipCode', e.target.value)}
                  error={errors.zipCode}
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                disabled={checkingDeposit}
                onClick={async () => {
                  if (!validateDetails()) return
                  // Check deposit requirement
                  setCheckingDeposit(true)
                  try {
                    const res = await fetch('/api/deposit-check', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: booking.customerEmail.trim(),
                        phone: booking.customerPhone.trim(),
                      }),
                    })
                    const data = await res.json()
                    setDepositRequired(data.deposit_required)
                    setDepositReason(data.reason || '')
                  } catch {
                    setDepositRequired(false)
                  } finally {
                    setCheckingDeposit(false)
                    goNext()
                  }
                }}
              >
                {checkingDeposit ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6 -- Review & Pay */}
        {/* ================================================================= */}
        {step === 6 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Review & pay
            </h2>

            <div className="space-y-6">

              {/* Service + Vehicle */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Service
                </h3>
                <div className="flex items-center gap-2">
                  {booking.service?.tier === 'express' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Zap className="h-3 w-3" /> Express
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      <Crown className="h-3 w-3" /> Premium
                    </span>
                  )}
                  <p className="font-semibold text-gray-900">{booking.service?.name}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {VEHICLE_TYPES.find((v) => v.key === booking.vehicleType)?.label}
                </p>

                {booking.service?.includes && booking.service.includes.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {booking.service.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add-ons */}
              {booking.addons.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Add-ons
                  </h3>
                  <div className="space-y-2">
                    {booking.addons.map((id) => {
                      const addon = ADDONS.find((a) => a.id === id)
                      if (!addon) return null
                      const qty = addon.quantifiable ? getAddonQuantity(id) : 1
                      return (
                        <div key={id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{addon.name}{qty > 1 ? ` x${qty}` : ''}</span>
                          <span className="text-gray-900">{formatCurrency(getAddonPrice(addon) * qty)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Schedule
                </h3>
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">{formatTime(booking.timeSlot)}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Location
                </h3>
                <p className="text-sm text-gray-900">
                  {booking.street}
                  {booking.unit ? `, ${booking.unit}` : ''}
                </p>
                <p className="text-sm text-gray-900">
                  {booking.city}, {booking.state} {booking.zipCode}
                </p>
              </div>

              {/* Contact */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Contact
                </h3>
                <p className="text-sm text-gray-900">{booking.customerName}</p>
                <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                <p className="text-sm text-gray-500">{booking.customerPhone}</p>
              </div>

              {/* Pricing breakdown */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Pricing
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {booking.service?.name} ({VEHICLE_TYPES.find((v) => v.key === booking.vehicleType)?.label})
                    </span>
                    <span className="text-gray-900">{formatCurrency(servicePrice)}</span>
                  </div>
                  {aiPriceAdjustment !== 0 && (
                    <div className={cn(
                      "flex items-center justify-between text-sm",
                      aiPriceAdjustment > 0 ? "text-amber-700" : "text-green-600"
                    )}>
                      <span>AI adjustment ({aiPriceAdjustment > 0 ? '+' : ''}{aiPriceAdjustment}%)</span>
                      <span>{aiPriceAdjustment > 0 ? '+' : '-'}{formatCurrency(Math.abs(aiAdjustedServicePrice - servicePrice))}</span>
                    </div>
                  )}
                  {booking.addons.map((id) => {
                    const addon = ADDONS.find((a) => a.id === id)
                    if (!addon) return null
                    const qty = addon.quantifiable ? getAddonQuantity(id) : 1
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{addon.name}{qty > 1 ? ` x${qty}` : ''}</span>
                        <span className="text-gray-900">{formatCurrency(getAddonPrice(addon) * qty)}</span>
                      </div>
                    )
                  })}
                  {travelFee.fee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-amber-700">{travelFee.label}</span>
                      <span className="text-amber-700">+{formatCurrency(travelFee.fee)}</span>
                    </div>
                  )}
                  <div className="my-2 border-t border-gray-100" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax (8.75%)</span>
                    <span className="text-gray-900">{formatCurrency(tax)}</span>
                  </div>
                  <div className="my-2 border-t border-gray-100" />
                  <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Price Confidence */}
              <ConfidenceBar
                confidence={priceConfidence.percent}
                message={priceConfidence.message}
                aiSuggestion={aiSuggestion}
                aiFactors={aiFactors}
              />

              {/* Price Appeal */}
              {booking.service && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Not sure about the price?</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        A technician will review your quote to get a better estimate.
                      </p>
                    </div>
                    <PriceAppealDialog
                      serviceSlug={booking.service.slug}
                      serviceName={booking.service.name}
                      quotedPrice={total}
                    />
                  </div>
                </div>
              )}

              {/* Deposit & Payment Info */}
              {depositRequired === false ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800">No deposit required!</p>
                  </div>
                  <p className="mt-1 text-xs text-green-700">
                    As a first-time customer, no deposit is needed. You&apos;ll pay after your service is completed.
                  </p>
                </div>
              ) : depositRequired === true && booking.service?.depositAmount && booking.service.depositAmount > 0 ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Deposit due today</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(booking.service.depositAmount)}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The remaining balance of {formatCurrency(total - booking.service.depositAmount)} will be charged after service completion.
                  </p>
                  {depositReason && (
                    <p className="mt-1 text-xs text-amber-600">Deposit required due to: {depositReason}</p>
                  )}
                </div>
              ) : null}

              {/* Cancellation Policy */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Cancellation Policy</h3>
                <div className="rounded-md border border-green-200 bg-green-50 p-3 mb-3">
                  <p className="text-sm font-medium text-green-800">Free cancellation available</p>
                  <p className="mt-1 text-xs text-green-700">
                    Cancel at least 24 hours before your appointment and your full deposit of{' '}
                    {formatCurrency(booking.service?.depositAmount || 0)} will be returned to your card within 5–10 business days.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li>Cancellations within 24 hours of the appointment will forfeit the deposit.</li>
                  <li>No-shows will be charged the full service amount.</li>
                  <li>Rescheduling is free up to 24 hours before the appointment.</li>
                </ul>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={booking.consentChecked}
                  onChange={(e) => updateBooking('consentChecked', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                  I agree to the cancellation policy and understand the final price may be adjusted
                  on-site based on actual vehicle condition.
                  {depositRequired
                    ? ` I agree to pay the deposit of ${formatCurrency(booking.service?.depositAmount || 0)} to confirm my booking.`
                    : ' I understand that no-shows or cancellations within 24 hours may result in a deposit requirement for future bookings.'}
                </span>
              </label>

              {/* Error */}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  size="lg"
                  disabled={isSubmitting || !booking.consentChecked}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : depositRequired ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay Deposit {formatCurrency(booking.service?.depositAmount || 0)}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Payment Slide-in */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => router.push(`/booking-confirmation?booking_id=${pendingBookingId}&payment=success`)}
        bookingId={pendingBookingId}
        amount={pendingAmount}
        paymentType="deposit"
        serviceName={booking.service?.name || 'Auto Detailing'}
      />
    </div>
  )
}

export default function BookingPage() {
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
      <BookingPageInner />
    </Suspense>
  )
}
