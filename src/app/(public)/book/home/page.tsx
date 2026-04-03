'use client'

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from '@/components/payment-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfidenceBar } from '@/components/ui/confidence-bar'
import { cn, formatCurrency, formatTime } from '@/lib/utils'
import { HOME_SERVICES, HOME_ADDONS, TIME_SLOTS, TAX_RATE, calculateTravelFee } from '@/lib/constants'
import {
  HOME_FLOORPLAN_LABEL,
  HOME_DIRTINESS_LABEL,
  HOME_LAST_CLEANED_LABEL,
  HOME_SERVICE_LABEL,
  HOME_CARPET_LABEL,
  HOME_BUILDING_LABEL,
  calculateHomePrice,
  estimateHomeDuration,
  getHomePriceConfidence,
  type HomeFloorplan,
  type HomeDirtiness,
  type HomeLastCleaned,
  type HomeServiceType,
  type HomeCarpetType,
  type HomeBuildingType,
  type PriceBreakdown,
} from '@/lib/pricing-engine'
import { PriceAppealDialog } from '@/components/price-appeal-dialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HomeBookingState {
  serviceSlug: string
  serviceType: HomeServiceType | ''
  floorplan: HomeFloorplan | ''
  sqft: string
  bedrooms: string
  bathrooms: string
  carpetType: HomeCarpetType | ''
  buildingType: HomeBuildingType | ''
  dirtiness: HomeDirtiness | ''
  lastCleaned: HomeLastCleaned | ''
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
  addons: string[]
  specialInstructions: string
  layoutNotes: string
  consentChecked: boolean
}

// Dropdown options
const BEDROOM_OPTIONS = [
  { value: 'studio', label: 'Studio' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5+', label: '5+' },
]

const BATHROOM_OPTIONS = [
  { value: '1', label: '1' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3' },
  { value: '3.5', label: '3.5' },
  { value: '4+', label: '4+' },
]

/** Map free-text sqft to nearest floorplan for pricing */
function sqftToFloorplan(sqft: number): HomeFloorplan {
  if (sqft < 800) return 'studio'
  if (sqft < 1200) return '1bed_1bath'
  if (sqft < 1800) return '2bed_1bath'
  if (sqft < 2500) return '2bed_2bath'
  return '3bed_plus'
}

/** Infer floorplan from bedrooms/bathrooms when sqft not provided */
function inferFloorplan(bedrooms: string, bathrooms: string): HomeFloorplan {
  const beds = parseInt(bedrooms, 10) || 0
  const baths = parseFloat(bathrooms) || 0
  if (beds === 0) return 'studio'
  if (beds === 1) return '1bed_1bath'
  if (beds === 2 && baths < 2) return '2bed_1bath'
  if (beds === 2) return '2bed_2bath'
  return '3bed_plus'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7

const STEP_LABELS = [
  'Service',
  'Home Details',
  'Condition',
  'Add-ons',
  'Date & Time',
  'Your Details',
  'Review',
]

const INITIAL_STATE: HomeBookingState = {
  serviceSlug: '',
  serviceType: '',
  floorplan: '',
  sqft: '',
  bedrooms: '',
  bathrooms: '',
  carpetType: '',
  buildingType: '',
  dirtiness: '',
  lastCleaned: '',
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
  addons: [],
  specialInstructions: '',
  layoutNotes: '',
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

function HomeBookingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [booking, setBooking] = useState<HomeBookingState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [pendingBookingId, setPendingBookingId] = useState('')
  const [pendingAmount, setPendingAmount] = useState(0)

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
  const goToStep = useCallback(
    (target: number) => {
      if (target >= 1 && target <= maxReachedStep) {
        setStep(target)
      }
    },
    [maxReachedStep]
  )

  const updateBooking = useCallback(
    <K extends keyof HomeBookingState>(key: K, value: HomeBookingState[K]) => {
      setBooking((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  // Pre-fill from URL params: ?service=slug
  useEffect(() => {
    const slug = searchParams.get('service')
    if (slug) {
      const found = HOME_SERVICES.find((s) => s.slug === slug)
      if (found) {
        setBooking((prev) => ({
          ...prev,
          serviceSlug: found.slug,
          serviceType: found.serviceType,
        }))
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
        const {
          data: { user },
        } = await supabase.auth.getUser()
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
        // Not logged in -- that is fine
      }
    }
    loadUser()
  }, [])

  // ----- Derived service data -----

  const selectedService = useMemo(() => {
    return HOME_SERVICES.find((s) => s.slug === booking.serviceSlug) || null
  }, [booking.serviceSlug])

  // ----- Pricing calculations -----

  const priceResult: PriceBreakdown | null = useMemo(() => {
    if (
      !booking.serviceType ||
      !booking.dirtiness ||
      !booking.lastCleaned
    )
      return null

    // Need either floorplan or sqft
    if (!booking.floorplan && !booking.sqft) return null

    return calculateHomePrice({
      floorplan: booking.floorplan || undefined,
      sqft: booking.sqft ? parseInt(booking.sqft, 10) : undefined,
      bedrooms: booking.bedrooms ? parseInt(booking.bedrooms, 10) : 0,
      bathrooms: booking.bathrooms ? parseInt(booking.bathrooms, 10) : 0,
      serviceType: booking.serviceType as HomeServiceType,
      dirtiness: booking.dirtiness as HomeDirtiness,
      lastCleaned: booking.lastCleaned as HomeLastCleaned,
      carpetType: booking.carpetType || undefined,
      buildingType: booking.buildingType || undefined,
    })
  }, [
    booking.serviceType,
    booking.floorplan,
    booking.sqft,
    booking.bedrooms,
    booking.bathrooms,
    booking.carpetType,
    booking.buildingType,
    booking.dirtiness,
    booking.lastCleaned,
  ])

  // ----- AI analysis state -----
  const [aiPriceAdjustment, setAiPriceAdjustment] = useState(0)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiFactors, setAiFactors] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced Gemini analysis when layout notes change
  useEffect(() => {
    if (!booking.layoutNotes || booking.layoutNotes.trim().length < 10) {
      setAiPriceAdjustment(0)
      setAiSuggestion('')
      setAiFactors([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      try {
        const res = await fetch('/api/analyze-home', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: booking.layoutNotes,
            bedrooms: booking.bedrooms,
            bathrooms: booking.bathrooms,
            sqft: booking.sqft,
            buildingType: booking.buildingType,
            carpetType: booking.carpetType,
            serviceType: booking.serviceType,
          }),
        })
        const data = await res.json()
        setAiPriceAdjustment(data.priceAdjustmentPercent || 0)
        setAiSuggestion(data.suggestion || '')
        setAiFactors(data.factors || [])
      } catch {
        // Silently fail — AI analysis is optional
      } finally {
        setAiLoading(false)
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [booking.layoutNotes, booking.bedrooms, booking.bathrooms, booking.sqft, booking.buildingType, booking.carpetType, booking.serviceType])

  // ----- Price confidence -----
  const priceConfidence = useMemo(() => {
    return getHomePriceConfidence({
      hasFloorplanOrSqft: !!(booking.floorplan || booking.sqft),
      hasBedrooms: !!booking.bedrooms,
      hasBathrooms: !!booking.bathrooms,
      hasCarpetType: !!booking.carpetType,
      hasBuildingType: !!booking.buildingType,
      hasDirtiness: !!booking.dirtiness,
      hasLastCleaned: !!booking.lastCleaned,
    })
  }, [booking.floorplan, booking.sqft, booking.bedrooms, booking.bathrooms, booking.carpetType, booking.buildingType, booking.dirtiness, booking.lastCleaned])

  // ----- Add-on pricing -----
  const addonTotal = useMemo(() => {
    return booking.addons.reduce((sum, id) => {
      const addon = HOME_ADDONS.find((a) => a.id === id)
      return sum + (addon?.price ?? 0)
    }, 0)
  }, [booking.addons])

  // Toggle add-on
  function toggleAddon(addonId: string) {
    setBooking((prev) => ({
      ...prev,
      addons: prev.addons.includes(addonId)
        ? prev.addons.filter((id) => id !== addonId)
        : [...prev.addons, addonId],
    }))
  }

  const travelFee = useMemo(() => {
    if (!booking.zipCode || booking.zipCode.length < 5) return { zone: 'local' as const, label: '', fee: 0, breakdown: '' }
    return calculateTravelFee(booking.zipCode.trim())
  }, [booking.zipCode])

  const baseSubtotal = priceResult?.subtotal ?? 0
  const aiAdjustedBase = aiPriceAdjustment !== 0
    ? Math.round(baseSubtotal * (1 + aiPriceAdjustment / 100))
    : baseSubtotal
  const subtotal = aiAdjustedBase + addonTotal + travelFee.fee
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax
  const depositAmount = selectedService?.depositAmount ?? 0

  const estimatedDuration = useMemo(() => {
    if (!booking.serviceType || !booking.floorplan) return selectedService?.duration ?? 0
    return estimateHomeDuration(
      booking.serviceType as HomeServiceType,
      booking.floorplan as HomeFloorplan
    )
  }, [booking.serviceType, booking.floorplan, selectedService])

  // ----- Validation helpers -----

  function validateHomeDetails(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.buildingType) {
      errs.buildingType = 'Please select a building type'
    }
    if (!booking.floorplan && !booking.sqft) {
      errs.sqft = 'Please select an approximate square footage'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateCondition(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.dirtiness) errs.dirtiness = 'Please select a dirtiness level'
    if (!booking.lastCleaned) errs.lastCleaned = 'Please select when last cleaned'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

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
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customerEmail.trim()))
      errs.customerEmail = 'Enter a valid email'
    if (!booking.customerPhone.trim()) errs.customerPhone = 'Phone number is required'
    else if (!/^[\d\s()+-]{10,}$/.test(booking.customerPhone.trim()))
      errs.customerPhone = 'Enter a valid phone number'
    setErrors(errs)
    return Object.keys(errs).length === 0
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
        service_slug: booking.serviceSlug,
        category: 'home_care',
        customer_name: booking.customerName.trim(),
        customer_email: booking.customerEmail.trim(),
        customer_phone: booking.customerPhone.trim(),
        scheduled_date: booking.date,
        scheduled_time: booking.timeSlot,
        estimated_duration: estimatedDuration,
        subtotal,
        tax,
        total,
        deposit_amount: depositAmount,
        street: booking.street.trim(),
        unit: booking.unit.trim() || null,
        city: booking.city.trim(),
        state: booking.state.trim(),
        zip_code: booking.zipCode.trim(),
        floorplan: booking.floorplan || null,
        home_service_type: booking.serviceType,
        home_dirtiness: booking.dirtiness,
        last_cleaned: booking.lastCleaned,
        special_instructions: [booking.specialInstructions.trim(), booking.layoutNotes.trim()].filter(Boolean).join('\n\n') || null,
        home_sqft: booking.sqft ? parseInt(booking.sqft, 10) : null,
        home_bedrooms: booking.bedrooms ? parseInt(booking.bedrooms, 10) : null,
        home_bathrooms: booking.bathrooms ? parseInt(booking.bathrooms, 10) : null,
        home_carpet_type: booking.carpetType || null,
        home_building_type: booking.buildingType || null,
        pricing_breakdown: priceResult,
        price_confidence: priceConfidence.percent,
        addons: booking.addons.map((id) => {
          const addon = HOME_ADDONS.find((a) => a.id === id)
          return { id, name: addon?.name ?? id, price: addon?.price ?? 0 }
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
      <div
        className={cn(
          'mx-auto px-5 py-8 sm:px-6 sm:py-12 lg:px-8',
          step === 1 ? 'max-w-4xl' : 'max-w-2xl'
        )}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Book Home Cleaning
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Professional cleaning delivered to your home.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator
            currentStep={step}
            maxReachedStep={maxReachedStep}
            onStepClick={goToStep}
          />
        </div>

        {/* ================================================================= */}
        {/* STEP 1 -- Choose Service */}
        {/* ================================================================= */}
        {step === 1 && (
          <div>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Choose a service</h2>

            <div className="space-y-3">
              {HOME_SERVICES.map((svc) => {
                const isSelected = booking.serviceSlug === svc.slug
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
                      updateBooking('serviceSlug', svc.slug)
                      updateBooking('serviceType', svc.serviceType)
                      goNext()
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {svc.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />~{svc.duration} min
                          </span>
                          <span>From {formatCurrency(svc.basePrice)}</span>
                        </div>
                      </div>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300">
                        {isSelected && <div className="h-3 w-3 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2 -- Home Details (redesigned) */}
        {/* ================================================================= */}
        {step === 2 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">Home details</h2>
            <p className="mb-6 text-sm text-gray-500">
              Tell us about your space so we can provide an accurate quote.
            </p>

            {/* 1. Building Type (required) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Building Type
              </label>
              {errors.buildingType && (
                <p className="mb-2 text-sm text-red-600">{errors.buildingType}</p>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(HOME_BUILDING_LABEL) as HomeBuildingType[]).map((key) => {
                  const isSelected = booking.buildingType === key
                  return (
                    <div
                      key={key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-4 text-center transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('buildingType', key)}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {HOME_BUILDING_LABEL[key]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Bedrooms & Bathrooms (dropdowns) */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Bedrooms</label>
                <div className="relative">
                  <select
                    value={booking.bedrooms}
                    onChange={(e) => {
                      updateBooking('bedrooms', e.target.value)
                      // Auto-set floorplan only when sqft not provided
                      if (!booking.sqft) {
                        updateBooking('floorplan', inferFloorplan(e.target.value, booking.bathrooms))
                      }
                    }}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select bedrooms</option>
                    {BEDROOM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Bathrooms</label>
                <div className="relative">
                  <select
                    value={booking.bathrooms}
                    onChange={(e) => {
                      updateBooking('bathrooms', e.target.value)
                      // Auto-set floorplan only when sqft not provided
                      if (!booking.sqft) {
                        updateBooking('floorplan', inferFloorplan(booking.bedrooms, e.target.value))
                      }
                    }}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select bathrooms</option>
                    {BATHROOM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* 3. Square Footage (free text input) */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Square Footage <span className="text-gray-400">(optional)</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Entering your square footage improves quote accuracy.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1200"
                value={booking.sqft}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  updateBooking('sqft', val)
                  if (val) {
                    updateBooking('floorplan', sqftToFloorplan(parseInt(val, 10)))
                  } else if (booking.bedrooms || booking.bathrooms) {
                    updateBooking('floorplan', inferFloorplan(booking.bedrooms, booking.bathrooms))
                  } else {
                    updateBooking('floorplan', '')
                  }
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* 4. Flooring / Carpet */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">Flooring</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(HOME_CARPET_LABEL) as HomeCarpetType[]).map((key) => {
                  const isSelected = booking.carpetType === key
                  return (
                    <div
                      key={key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-3 text-center transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('carpetType', key)}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {HOME_CARPET_LABEL[key]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 5. Special Layout Notes */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Special Layout Details <span className="text-gray-400">(optional)</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Describe any unique areas to help us give you the most accurate quote.
              </p>
              <textarea
                rows={4}
                placeholder="E.g., large walk-in closet, oversized master bathroom, sunroom, finished basement, garage, lots of windows..."
                value={booking.layoutNotes}
                onChange={(e) => updateBooking('layoutNotes', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Quote Accuracy Indicator */}
            <div className="mt-6">
              <ConfidenceBar
                confidence={priceConfidence.percent}
                message={priceConfidence.message}
                aiSuggestion={aiSuggestion}
                aiFactors={aiFactors}
                aiLoading={aiLoading}
                tips={[
                  ...(!booking.buildingType ? ['Select your building type'] : []),
                  ...(!booking.bedrooms ? ['Choose number of bedrooms'] : []),
                  ...(!booking.bathrooms ? ['Choose number of bathrooms'] : []),
                  ...(!booking.sqft ? ['Select your approximate square footage'] : []),
                  ...(!booking.carpetType ? ['Select your flooring type'] : []),
                  ...(!booking.dirtiness ? ['Tell us about the current condition (next step)'] : []),
                  ...(!booking.layoutNotes.trim() ? ['Describe any special areas or unique layout features'] : []),
                ]}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (validateHomeDetails()) goNext()
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 -- Condition */}
        {/* ================================================================= */}
        {step === 3 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">Condition</h2>
            <p className="mb-4 text-sm text-gray-500">
              Help us understand the current state of your home.
            </p>

            {/* Persistent confidence bar */}
            <div className="mb-6">
              <ConfidenceBar confidence={priceConfidence.percent} message={priceConfidence.message} compact />
            </div>

            {/* Dirtiness level */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Dirtiness Level
              </label>
              {errors.dirtiness && (
                <p className="mb-2 text-sm text-red-600">{errors.dirtiness}</p>
              )}
              <div className="space-y-2">
                {(Object.keys(HOME_DIRTINESS_LABEL) as HomeDirtiness[]).map((key) => {
                  const isSelected = booking.dirtiness === key
                  return (
                    <div
                      key={key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-4 transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('dirtiness', key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {HOME_DIRTINESS_LABEL[key]}
                        </span>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300">
                          {isSelected && <div className="h-3 w-3 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Last Cleaned */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-gray-700">Last Cleaned</label>
              {errors.lastCleaned && (
                <p className="mb-2 text-sm text-red-600">{errors.lastCleaned}</p>
              )}
              <div className="space-y-2">
                {(Object.keys(HOME_LAST_CLEANED_LABEL) as HomeLastCleaned[]).map((key) => {
                  const isSelected = booking.lastCleaned === key
                  return (
                    <div
                      key={key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-4 transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('lastCleaned', key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {HOME_LAST_CLEANED_LABEL[key]}
                        </span>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300">
                          {isSelected && <div className="h-3 w-3 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (validateCondition()) goNext()
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4 -- Add-ons */}
        {/* ================================================================= */}
        {step === 4 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">Add-ons</h2>
            <p className="mb-4 text-sm text-gray-500">
              Enhance your cleaning with optional extras.
            </p>

            {/* Persistent confidence bar */}
            <div className="mb-6">
              <ConfidenceBar confidence={priceConfidence.percent} message={priceConfidence.message} compact />
            </div>

            <div className="space-y-3">
              {HOME_ADDONS.map((addon) => {
                const isSelected = booking.addons.includes(addon.id)
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      'cursor-pointer rounded-lg border bg-white p-4 transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
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
                          <p className="mt-0.5 text-sm text-gray-500">{addon.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-gray-900">
                          +{formatCurrency(addon.price)}
                        </span>
                        <p className="text-xs text-gray-400">{addon.unit}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Running total */}
            {priceResult && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedService?.name} (base)</span>
                  <span>{formatCurrency(baseSubtotal)}</span>
                </div>
                {aiPriceAdjustment !== 0 && (
                  <div className={cn(
                    "flex items-center justify-between text-sm mt-1",
                    aiPriceAdjustment > 0 ? "text-amber-700" : "text-green-600"
                  )}>
                    <span>AI adjustment ({aiPriceAdjustment > 0 ? '+' : ''}{aiPriceAdjustment}%)</span>
                    <span>{aiPriceAdjustment > 0 ? '+' : '-'}{formatCurrency(Math.abs(aiAdjustedBase - baseSubtotal))}</span>
                  </div>
                )}
                {booking.addons.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {booking.addons.map((id) => {
                      const addon = HOME_ADDONS.find((a) => a.id === id)
                      if (!addon) return null
                      return (
                        <div key={id} className="flex items-center justify-between text-sm text-gray-600">
                          <span>{addon.name}</span>
                          <span>+{formatCurrency(addon.price)}</span>
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
            )}

            <div className="mt-8 flex justify-end">
              <Button onClick={goNext}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 5 -- Date & Time */}
        {/* ================================================================= */}
        {step === 5 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">Pick a date & time</h2>

            <div className="space-y-8">
              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Date</label>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Time</label>
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
              <Button
                onClick={() => {
                  if (validateSchedule()) goNext()
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 6 -- Your Details (Contact + Service Address) */}
        {/* ================================================================= */}
        {step === 6 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">Your details</h2>

            {/* Contact Info */}
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
              Contact
            </h3>
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
            <h3 className="mb-3 mt-8 text-sm font-medium uppercase tracking-wide text-gray-500">
              Service Address
            </h3>
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

            {/* Special Instructions */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Special Instructions (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any access codes, parking instructions, areas to focus on..."
                value={booking.specialInstructions}
                onChange={(e) => updateBooking('specialInstructions', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (validateDetails()) goNext()
                }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 7 -- Review & Pay */}
        {/* ================================================================= */}
        {step === 7 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">Review & pay</h2>

            <div className="space-y-6">
              {/* Service */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Service
                </h3>
                <p className="font-semibold text-gray-900">{selectedService?.name}</p>
                <p className="mt-1 text-sm text-gray-500">{selectedService?.description}</p>
                {booking.serviceType && (
                  <p className="mt-1 text-sm text-gray-500">
                    Type: {HOME_SERVICE_LABEL[booking.serviceType as HomeServiceType]}
                  </p>
                )}
              </div>

              {/* Home Details */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Home Details
                </h3>
                <div className="space-y-1 text-sm">
                  {booking.floorplan && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Floorplan:</span>{' '}
                      {HOME_FLOORPLAN_LABEL[booking.floorplan as HomeFloorplan]}
                    </p>
                  )}
                  {booking.sqft && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Square Footage:</span>{' '}
                      {parseInt(booking.sqft, 10).toLocaleString()} sqft
                    </p>
                  )}
                  {booking.bedrooms && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Bedrooms:</span> {booking.bedrooms}
                    </p>
                  )}
                  {booking.bathrooms && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Bathrooms:</span> {booking.bathrooms}
                    </p>
                  )}
                  {booking.buildingType && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Building:</span>{' '}
                      {HOME_BUILDING_LABEL[booking.buildingType as HomeBuildingType]}
                    </p>
                  )}
                  {booking.carpetType && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Flooring:</span>{' '}
                      {HOME_CARPET_LABEL[booking.carpetType as HomeCarpetType]}
                    </p>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Condition
                </h3>
                <div className="space-y-1 text-sm">
                  {booking.dirtiness && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Dirtiness:</span>{' '}
                      {HOME_DIRTINESS_LABEL[booking.dirtiness as HomeDirtiness]}
                    </p>
                  )}
                  {booking.lastCleaned && (
                    <p className="text-gray-900">
                      <span className="text-gray-500">Last Cleaned:</span>{' '}
                      {HOME_LAST_CLEANED_LABEL[booking.lastCleaned as HomeLastCleaned]}
                    </p>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
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
                {estimatedDuration > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Estimated duration: ~{estimatedDuration} min
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
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
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Contact
                </h3>
                <p className="text-sm text-gray-900">{booking.customerName}</p>
                <p className="text-sm text-gray-500">{booking.customerEmail}</p>
                <p className="text-sm text-gray-500">{booking.customerPhone}</p>
              </div>

              {/* Layout Notes */}
              {booking.layoutNotes.trim() && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                    Layout Details
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {booking.layoutNotes}
                  </p>
                  {aiFactors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {aiFactors.map((f, i) => (
                        <span key={i} className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Special Instructions */}
              {booking.specialInstructions.trim() && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                    Special Instructions
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {booking.specialInstructions}
                  </p>
                </div>
              )}

              {/* Add-ons */}
              {booking.addons.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                    Add-ons
                  </h3>
                  <div className="space-y-1 text-sm">
                    {booking.addons.map((id) => {
                      const addon = HOME_ADDONS.find((a) => a.id === id)
                      if (!addon) return null
                      return (
                        <div key={id} className="flex items-center justify-between">
                          <span className="text-gray-600">{addon.name}</span>
                          <span className="text-gray-900">{formatCurrency(addon.price)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pricing breakdown */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Pricing
                </h3>
                <div className="space-y-2">
                  {priceResult?.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      {item.amount > 0 && (
                        <span className="text-gray-900">{formatCurrency(item.amount)}</span>
                      )}
                    </div>
                  ))}
                  {priceResult && priceResult.multiplier !== 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Condition multiplier ({priceResult.multiplier.toFixed(2)}x)
                      </span>
                      <span className="text-gray-400">applied</span>
                    </div>
                  )}
                  {aiPriceAdjustment !== 0 && (
                    <div className={cn(
                      "flex items-center justify-between text-sm",
                      aiPriceAdjustment > 0 ? "text-amber-700" : "text-green-600"
                    )}>
                      <span>AI adjustment ({aiPriceAdjustment > 0 ? '+' : ''}{aiPriceAdjustment}%)</span>
                      <span>{aiPriceAdjustment > 0 ? '+' : '-'}{formatCurrency(Math.abs(aiAdjustedBase - baseSubtotal))}</span>
                    </div>
                  )}
                  {booking.addons.length > 0 && (
                    <>
                      <div className="my-2 border-t border-gray-100" />
                      {booking.addons.map((id) => {
                        const addon = HOME_ADDONS.find((a) => a.id === id)
                        if (!addon) return null
                        return (
                          <div key={id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{addon.name}</span>
                            <span className="text-gray-900">+{formatCurrency(addon.price)}</span>
                          </div>
                        )
                      })}
                    </>
                  )}
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
                    <span className="text-gray-600">Tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
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
                aiLoading={aiLoading}
              />

              {/* Price Appeal */}
              {selectedService && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Not sure about the price?</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        A technician will review your quote to get a better estimate.
                      </p>
                    </div>
                    <PriceAppealDialog
                      serviceSlug={selectedService.slug}
                      serviceName={selectedService.name}
                      quotedPrice={total}
                    />
                  </div>
                </div>
              )}

              {/* Deposit & Payment Info */}
              {depositAmount > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Deposit due today</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(depositAmount)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    The remaining balance of {formatCurrency(total - depositAmount)} will be charged
                    after service completion.
                  </p>
                </div>
              )}

              {/* Cancellation Policy */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">Cancellation Policy</h3>
                <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-medium text-green-800">Free cancellation available</p>
                  <p className="mt-1 text-xs text-green-700">
                    Cancel at least 24 hours before your appointment and your full deposit of{' '}
                    {formatCurrency(depositAmount)} will be returned to your card within 5-10
                    business days.
                  </p>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li>Cancellations within 24 hours of the appointment will forfeit the deposit.</li>
                  <li>No-shows will be charged the full service amount.</li>
                  <li>Rescheduling is free up to 24 hours before the appointment.</li>
                </ul>
              </div>

              {/* Consent */}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={booking.consentChecked}
                  onChange={(e) => updateBooking('consentChecked', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                  I agree to the cancellation policy and understand the final price may be adjusted
                  on-site based on actual home condition. I agree to pay the deposit of{' '}
                  {formatCurrency(depositAmount)} to confirm my booking.
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
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay Deposit {formatCurrency(depositAmount)}
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
        serviceName={selectedService?.name || 'Home Cleaning'}
      />
    </div>
  )
}

export default function HomeBookingPage() {
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
      <HomeBookingPageInner />
    </Suspense>
  )
}
