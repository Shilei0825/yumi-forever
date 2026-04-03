'use client'

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CreditCard,
  Building2,
  Shield,
  Star,
  UtensilsCrossed,
  Coffee,
  Dumbbell,
  Stethoscope,
  Store,
  Scissors,
  Warehouse,
  GraduationCap,
  Baby,
  Laptop,
  BriefcaseMedical,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatTime } from '@/lib/utils'
import {
  OFFICE_PLANS,
  OFFICE_SQFT_RANGES,
  BUSINESS_TYPES,
  CLEANING_FREQUENCIES,
  CONTRACT_DISCOUNTS,
  TIME_SLOTS,
  calculateCommercialQuote,
  calculateTravelFee,
  type BusinessType,
  type CleaningFrequency,
  type CommercialQuote,
} from '@/lib/constants'
import { PriceAppealDialog } from '@/components/price-appeal-dialog'
import { ConfidenceBar } from '@/components/ui/confidence-bar'
import { PaymentModal } from '@/components/payment-modal'
import { getOfficePriceConfidence } from '@/lib/pricing-engine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfficeBookingState {
  businessType: BusinessType | ''
  sqftRange: string
  customSqft: string
  restrooms: string
  planTier: 'essential' | 'professional' | 'premier' | ''
  planName: string
  frequency: CleaningFrequency | ''
  contractMonths: number
  date: string
  timeSlot: string
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone: string
  street: string
  unit: string
  city: string
  state: string
  zipCode: string
  specialRequirements: string
  consentChecked: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 7

const STEP_LABELS = [
  'Type',
  'Space',
  'Level',
  'Frequency',
  'Date',
  'Details',
  'Review',
]

const INITIAL_STATE: OfficeBookingState = {
  businessType: '',
  sqftRange: '',
  customSqft: '',
  restrooms: '1',
  planTier: '',
  planName: '',
  frequency: '',
  contractMonths: 1,
  date: '',
  timeSlot: '',
  businessName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  street: '',
  unit: '',
  city: '',
  state: 'NY',
  zipCode: '',
  specialRequirements: '',
  consentChecked: false,
}

// Business type icons
const BUSINESS_ICONS: Record<BusinessType, React.ReactNode> = {
  office: <Building2 className="h-5 w-5" />,
  coworking: <Laptop className="h-5 w-5" />,
  restaurant: <UtensilsCrossed className="h-5 w-5" />,
  cafe: <Coffee className="h-5 w-5" />,
  gym: <Dumbbell className="h-5 w-5" />,
  medical: <Stethoscope className="h-5 w-5" />,
  dental: <BriefcaseMedical className="h-5 w-5" />,
  retail: <Store className="h-5 w-5" />,
  salon: <Scissors className="h-5 w-5" />,
  warehouse: <Warehouse className="h-5 w-5" />,
  school: <GraduationCap className="h-5 w-5" />,
  daycare: <Baby className="h-5 w-5" />,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function getEffectiveSqft(sqftRange: string, customSqft: string): number {
  if (sqftRange === 'custom' && customSqft) {
    const parsed = parseInt(customSqft.replace(/,/g, ''), 10)
    return isNaN(parsed) ? 0 : parsed
  }
  const range = OFFICE_SQFT_RANGES.find((r) => r.key === sqftRange)
  return range?.sqft ?? 0
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

function OfficeBookingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [booking, setBooking] = useState<OfficeBookingState>(INITIAL_STATE)
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
    <K extends keyof OfficeBookingState>(key: K, value: OfficeBookingState[K]) => {
      setBooking((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  // Pre-fill from URL params: ?plan=slug
  useEffect(() => {
    const planSlug = searchParams.get('plan')
    if (planSlug) {
      const found = OFFICE_PLANS.find((p) => p.slug === planSlug)
      if (found) {
        setBooking((prev) => ({ ...prev, planTier: found.tier, planName: found.name }))
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
              contactName: profile.full_name || '',
              contactEmail: profile.email || user.email || '',
              contactPhone: profile.phone || '',
            }))
          }
        }
      } catch {
        // Not logged in -- that is fine
      }
    }
    loadUser()
  }, [])

  // ----- Derived data -----

  const selectedBusinessType = useMemo(
    () => BUSINESS_TYPES.find((bt) => bt.key === booking.businessType),
    [booking.businessType]
  )

  const effectiveSqft = useMemo(
    () => getEffectiveSqft(booking.sqftRange, booking.customSqft),
    [booking.sqftRange, booking.customSqft]
  )

  const selectedPlan = useMemo(
    () => OFFICE_PLANS.find((p) => p.tier === booking.planTier),
    [booking.planTier]
  )

  const selectedFrequency = useMemo(
    () => CLEANING_FREQUENCIES.find((f) => f.key === booking.frequency),
    [booking.frequency]
  )

  // ----- Quote calculation -----

  const quote: CommercialQuote | null = useMemo(() => {
    if (
      !booking.businessType ||
      !booking.planTier ||
      !booking.frequency ||
      effectiveSqft <= 0
    )
      return null

    return calculateCommercialQuote({
      sqft: effectiveSqft,
      planTier: booking.planTier as 'essential' | 'professional' | 'premier',
      frequency: booking.frequency as CleaningFrequency,
      businessType: booking.businessType as BusinessType,
      restrooms: parseInt(booking.restrooms) || 0,
      contractMonths: booking.contractMonths,
    })
  }, [
    booking.businessType,
    booking.planTier,
    booking.frequency,
    booking.contractMonths,
    booking.restrooms,
    effectiveSqft,
  ])

  // ----- AI analysis state -----
  const [aiPriceAdjustment, setAiPriceAdjustment] = useState(0)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiFactors, setAiFactors] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced Gemini analysis when special requirements change
  useEffect(() => {
    if (!booking.specialRequirements || booking.specialRequirements.trim().length < 10) {
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
            category: 'office',
            notes: booking.specialRequirements,
            businessType: booking.businessType,
            spaceSize: String(effectiveSqft),
            restrooms: booking.restrooms,
            serviceLevel: booking.planTier,
            frequency: booking.frequency,
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
  }, [booking.specialRequirements, booking.businessType, effectiveSqft, booking.restrooms, booking.planTier, booking.frequency])

  // ----- Price confidence -----
  const priceConfidence = useMemo(() => {
    return getOfficePriceConfidence({
      hasBusinessType: !!booking.businessType,
      hasSpaceSize: !!booking.sqftRange,
      hasRestrooms: !!booking.restrooms && parseInt(booking.restrooms) >= 0,
      hasServiceLevel: !!booking.planTier,
      hasFrequency: !!booking.frequency,
      hasContract: booking.contractMonths > 1,
    })
  }, [booking.businessType, booking.sqftRange, booking.restrooms, booking.planTier, booking.frequency, booking.contractMonths])

  // ----- Validation helpers -----

  function validateSpaceDetails(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.sqftRange) errs.sqftRange = 'Please select a space size'
    if (booking.sqftRange === 'custom') {
      const parsed = parseInt(booking.customSqft.replace(/,/g, ''), 10)
      if (!booking.customSqft || isNaN(parsed) || parsed <= 0) {
        errs.customSqft = 'Please enter a valid square footage'
      }
    }
    if (!booking.restrooms.trim() || parseInt(booking.restrooms) < 0) {
      errs.restrooms = 'Number of restrooms is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateFrequency(): boolean {
    const errs: Record<string, string> = {}
    if (!booking.frequency) errs.frequency = 'Please select a cleaning frequency'
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
    if (!booking.businessName.trim()) errs.businessName = 'Business name is required'
    if (!booking.contactName.trim()) errs.contactName = 'Contact name is required'
    if (!booking.contactEmail.trim()) errs.contactEmail = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.contactEmail.trim()))
      errs.contactEmail = 'Enter a valid email'
    if (!booking.contactPhone.trim()) errs.contactPhone = 'Phone number is required'
    else if (!/^[\d\s()+-]{10,}$/.test(booking.contactPhone.trim()))
      errs.contactPhone = 'Enter a valid phone number'
    if (!booking.street.trim()) errs.street = 'Street address is required'
    if (!booking.city.trim()) errs.city = 'City is required'
    if (!booking.state.trim() || booking.state.trim().length < 2) errs.state = 'State is required'
    if (!booking.zipCode.trim()) errs.zipCode = 'Zip code is required'
    else if (!/^\d{5}$/.test(booking.zipCode.trim())) errs.zipCode = 'Enter a valid 5-digit zip code'
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
      const planSlug = OFFICE_PLANS.find((p) => p.tier === booking.planTier)?.slug ?? booking.planTier
      const payload = {
        service_slug: planSlug,
        category: 'office',
        customer_name: booking.contactName.trim(),
        customer_email: booking.contactEmail.trim(),
        customer_phone: booking.contactPhone.trim(),
        scheduled_date: booking.date,
        scheduled_time: booking.timeSlot,
        subtotal: quote?.monthlyRate ?? 0,
        tax: quote?.monthlyTax ?? 0,
        total: quote?.monthlyTotal ?? 0,
        deposit_amount: quote?.monthlyTotal ?? 0,
        street: booking.street.trim(),
        unit: booking.unit.trim() || null,
        city: booking.city.trim(),
        state: booking.state.trim(),
        zip_code: booking.zipCode.trim(),
        service_notes: JSON.stringify({
          business_name: booking.businessName.trim(),
          business_type: booking.businessType,
          sqft: effectiveSqft,
          restrooms: booking.restrooms.trim(),
          plan_tier: booking.planTier,
          frequency: booking.frequency,
          contract_months: booking.contractMonths,
          industry_multiplier: selectedBusinessType?.multiplier ?? 1,
          special_requirements: booking.specialRequirements.trim(),
          quote_breakdown: quote?.lineItems,
        }),
        recurring_mode: booking.frequency,
        price_confidence: priceConfidence.percent,
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
      if (data.booking_id) {
        setPendingBookingId(data.booking_id)
        setPendingAmount(quote?.monthlyTotal ?? 0)
        setShowPayment(true)
      } else {
        router.push(`/portal/bookings/${data.booking_number || ''}?success=true`)
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to compute a preview quote for each plan tier on step 3
  function getQuoteForTier(tier: 'essential' | 'professional' | 'premier'): CommercialQuote | null {
    if (!booking.businessType || effectiveSqft <= 0) return null
    return calculateCommercialQuote({
      sqft: effectiveSqft,
      planTier: tier,
      frequency: 'weekly',
      businessType: booking.businessType as BusinessType,
      restrooms: parseInt(booking.restrooms) || 0,
      contractMonths: 1,
    })
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="min-h-screen bg-neutral-50 pb-mobile-cta">
      <div
        className={cn(
          'mx-auto px-5 py-8 sm:px-6 sm:py-12 lg:px-8',
          step === 1 || step === 3 ? 'max-w-4xl' : 'max-w-2xl'
        )}
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Get an Instant Quote
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Smart pricing based on your business type, space size, and cleaning needs.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={step} maxReachedStep={maxReachedStep} onStepClick={goToStep} />
        </div>

        {/* ================================================================= */}
        {/* STEP 1 -- Business Type */}
        {/* ================================================================= */}
        {step === 1 && (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              What type of business do you have?
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Different industries have different cleaning requirements. This helps us give you an accurate quote.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUSINESS_TYPES.map((bt) => {
                const isSelected = booking.businessType === bt.key
                return (
                  <div
                    key={bt.key}
                    className={cn(
                      'cursor-pointer rounded-xl border bg-white p-4 transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => {
                      updateBooking('businessType', bt.key)
                      goNext()
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                      )}>
                        {BUSINESS_ICONS[bt.key]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900">{bt.label}</h3>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{bt.description}</p>
                        {bt.multiplier > 1 && (
                          <p className="mt-1 text-xs text-amber-600">
                            Specialized cleaning required
                          </p>
                        )}
                        {bt.multiplier < 1 && (
                          <p className="mt-1 text-xs text-green-600">
                            Simplified scope — lower cost
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 2 -- Space Details */}
        {/* ================================================================= */}
        {step === 2 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">Space details</h2>
            <p className="mb-6 text-sm text-gray-500">
              How large is your {selectedBusinessType?.label.toLowerCase() ?? 'space'}?
            </p>

            {/* Industry-specific notes */}
            {selectedBusinessType && selectedBusinessType.extraNotes.length > 0 && (
              <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                  {selectedBusinessType.label} cleaning includes
                </p>
                <ul className="mt-2 space-y-1">
                  {selectedBusinessType.extraNotes.map((note, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-violet-800">
                      <Check className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Size selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Space Size</label>
              {errors.sqftRange && (
                <p className="mb-2 text-sm text-red-600">{errors.sqftRange}</p>
              )}
              <div className="space-y-2">
                {OFFICE_SQFT_RANGES.map((size) => {
                  const isSelected = booking.sqftRange === size.key
                  return (
                    <div
                      key={size.key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-4 transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => {
                        updateBooking('sqftRange', size.key)
                        if (size.key !== 'custom') {
                          updateBooking('customSqft', '')
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{size.label}</h3>
                          <p className="text-sm text-gray-500">{size.description}</p>
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

            {/* Custom sqft input */}
            {booking.sqftRange === 'custom' && (
              <div className="mt-4">
                <Input
                  label="Exact Square Footage"
                  type="text"
                  placeholder="e.g. 4,200"
                  value={booking.customSqft}
                  onChange={(e) => updateBooking('customSqft', e.target.value)}
                  error={errors.customSqft}
                  className="max-w-xs"
                />
              </div>
            )}

            {/* Restrooms */}
            <div className="mt-8">
              <Input
                label="Number of Restrooms"
                type="number"
                min="0"
                placeholder="1"
                value={booking.restrooms}
                onChange={(e) => updateBooking('restrooms', e.target.value)}
                error={errors.restrooms}
                className="max-w-xs"
              />
            </div>

            {/* Quote Accuracy */}
            <div className="mt-6">
              <ConfidenceBar
                confidence={priceConfidence.percent}
                message={priceConfidence.message}
                tips={[
                  ...(!booking.businessType ? ['Select your business type'] : []),
                  ...(!booking.sqftRange ? ['Choose your space size'] : []),
                  ...(!booking.planTier ? ['Select a service level (next step)'] : []),
                  ...(!booking.frequency ? ['Choose cleaning frequency (upcoming step)'] : []),
                  ...(!booking.specialRequirements.trim() ? ['Add special requirements for better accuracy (later step)'] : []),
                ]}
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => { if (validateSpaceDetails()) goNext() }}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 3 -- Service Level */}
        {/* ================================================================= */}
        {step === 3 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-2 text-lg font-semibold text-gray-900">Choose your service level</h2>
            <p className="mb-6 text-sm text-gray-500">
              Prices customized for {effectiveSqft.toLocaleString()} sqft {selectedBusinessType?.label.toLowerCase()}.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              {OFFICE_PLANS.map((plan) => {
                const isSelected = booking.planTier === plan.tier
                const previewQuote = getQuoteForTier(plan.tier)
                const tierIcon =
                  plan.tier === 'essential' ? (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  ) : plan.tier === 'professional' ? (
                    <Shield className="h-4 w-4 text-violet-600" />
                  ) : (
                    <Star className="h-4 w-4 text-amber-600" />
                  )
                const tierColor =
                  plan.tier === 'essential'
                    ? 'bg-blue-100'
                    : plan.tier === 'professional'
                      ? 'bg-violet-100'
                      : 'bg-amber-100'

                return (
                  <div
                    key={plan.slug}
                    className={cn(
                      'relative cursor-pointer rounded-2xl border bg-white p-5 transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => {
                      updateBooking('planTier', plan.tier)
                      updateBooking('planName', plan.name)
                      goNext()
                    }}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    )}

                    <div className="mb-3 flex items-center gap-2">
                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', tierColor)}>
                        {tierIcon}
                      </div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>

                    <ul className="mt-4 space-y-1.5">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 5 && (
                        <li className="text-xs text-gray-400">
                          +{plan.features.length - 5} more
                        </li>
                      )}
                    </ul>

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      {previewQuote ? (
                        <>
                          <p className="text-xs text-gray-400">Estimated weekly</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(previewQuote.monthlyRate)}
                            <span className="text-sm font-normal text-gray-400">/mo</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            ~{formatCurrency(previewQuote.perVisitRate)}/visit
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-400">Starting from</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(plan.pricing.small.monthly)}
                            <span className="text-sm font-normal text-gray-400">/mo</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 4 -- Frequency & Contract */}
        {/* ================================================================= */}
        {step === 4 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">Frequency & contract</h2>
            <p className="mb-6 text-sm text-gray-500">
              Choose how often you need cleaning and save with a longer commitment.
            </p>

            {/* Cleaning Frequency */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cleaning Frequency</label>
              {errors.frequency && (
                <p className="mb-2 text-sm text-red-600">{errors.frequency}</p>
              )}
              <div className="space-y-3">
                {CLEANING_FREQUENCIES.map((freq) => {
                  const isSelected = booking.frequency === freq.key
                  // Show live quote for this frequency
                  const freqQuote = booking.businessType && booking.planTier && effectiveSqft > 0
                    ? calculateCommercialQuote({
                        sqft: effectiveSqft,
                        planTier: booking.planTier as 'essential' | 'professional' | 'premier',
                        frequency: freq.key,
                        businessType: booking.businessType as BusinessType,
                        restrooms: parseInt(booking.restrooms) || 0,
                        contractMonths: booking.contractMonths,
                      })
                    : null
                  return (
                    <div
                      key={freq.key}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-5 transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('frequency', freq.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{freq.label}</h3>
                          <p className="mt-0.5 text-sm text-gray-500">{freq.description}</p>
                        </div>
                        <div className="text-right">
                          {freqQuote && (
                            <div>
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(freqQuote.monthlyRate)}
                                <span className="text-xs font-normal text-gray-400">/mo</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                ~{formatCurrency(freqQuote.perVisitRate)}/visit
                              </p>
                            </div>
                          )}
                          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 ml-auto">
                            {isSelected && <div className="h-3 w-3 rounded-full bg-primary" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contract Length */}
            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-gray-700">Contract Length</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CONTRACT_DISCOUNTS.map((contract) => {
                  const isSelected = booking.contractMonths === contract.months
                  return (
                    <div
                      key={contract.months}
                      className={cn(
                        'cursor-pointer rounded-lg border bg-white p-4 text-center transition-colors',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => updateBooking('contractMonths', contract.months)}
                    >
                      <p className="font-semibold text-gray-900">{contract.label}</p>
                      {contract.discount > 0 ? (
                        <p className="mt-1 text-xs font-medium text-green-600">
                          Save {Math.round(contract.discount * 100)}%
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-400">No commitment</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Running price preview */}
            {quote && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
                {quote.lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{item.label}</span>
                    {item.amount !== 0 && (
                      <span className={item.amount < 0 ? 'text-green-600' : ''}>
                        {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                      </span>
                    )}
                  </div>
                ))}
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <div className="flex items-center justify-between font-semibold text-gray-900">
                    <span>Monthly rate</span>
                    <span>{formatCurrency(quote.monthlyRate)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => { if (validateFrequency()) goNext() }}>
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
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Pick your first service date & time
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Select when you&apos;d like the first cleaning to take place.
            </p>

            <div className="space-y-8">
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

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Preferred Time Slot</label>
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
        {/* STEP 6 -- Your Details */}
        {/* ================================================================= */}
        {step === 6 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">Your details</h2>

            {/* Business Info */}
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Business</h3>
            <div className="space-y-4">
              <Input
                label="Business Name"
                placeholder="Acme Corp"
                value={booking.businessName}
                onChange={(e) => updateBooking('businessName', e.target.value)}
                error={errors.businessName}
              />
            </div>

            {/* Contact Info */}
            <h3 className="mb-3 mt-8 text-sm font-medium uppercase tracking-wide text-gray-500">Contact</h3>
            <div className="space-y-4">
              <Input
                label="Contact Name"
                placeholder="John Doe"
                value={booking.contactName}
                onChange={(e) => updateBooking('contactName', e.target.value)}
                error={errors.contactName}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={booking.contactEmail}
                  onChange={(e) => updateBooking('contactEmail', e.target.value)}
                  error={errors.contactEmail}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={booking.contactPhone}
                  onChange={(e) => updateBooking('contactPhone', e.target.value)}
                  error={errors.contactPhone}
                />
              </div>
            </div>

            {/* Business Address */}
            <h3 className="mb-3 mt-8 text-sm font-medium uppercase tracking-wide text-gray-500">
              Business Address
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
                  label="Unit / Suite"
                  placeholder="Suite 200"
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

            {/* Special Requirements */}
            <div className="mt-8">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Special Requirements (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any specific cleaning needs, access instructions, or special areas of concern..."
                value={booking.specialRequirements}
                onChange={(e) => updateBooking('specialRequirements', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={() => { if (validateDetails()) goNext() }}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 7 -- Review & Quote */}
        {/* ================================================================= */}
        {step === 7 && (
          <div>
            <button
              onClick={goBack}
              className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <h2 className="mb-6 text-lg font-semibold text-gray-900">Review your quote</h2>

            <div className="space-y-6">
              {/* Business Type */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Business Type
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    {booking.businessType && BUSINESS_ICONS[booking.businessType]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedBusinessType?.label}</p>
                    <p className="text-sm text-gray-500">{selectedBusinessType?.description}</p>
                  </div>
                </div>
                {selectedBusinessType && selectedBusinessType.multiplier !== 1 && (
                  <p className="mt-2 text-xs text-gray-400">
                    Industry adjustment: {selectedBusinessType.multiplier > 1 ? '+' : ''}
                    {Math.round((selectedBusinessType.multiplier - 1) * 100)}%
                    {selectedBusinessType.multiplier > 1
                      ? ' for specialized requirements'
                      : ' simplified scope discount'}
                  </p>
                )}
              </div>

              {/* Space & Service Level */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Space & Service
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Space Size</p>
                    <p className="font-medium text-gray-900">{effectiveSqft.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Restrooms</p>
                    <p className="font-medium text-gray-900">{booking.restrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Level</p>
                    <div className="flex items-center gap-1.5">
                      {selectedPlan?.tier === 'essential' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Building2 className="h-3 w-3" /> Essential
                        </span>
                      ) : selectedPlan?.tier === 'professional' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          <Shield className="h-3 w-3" /> Professional
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Star className="h-3 w-3" /> Premier
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cleaning Schedule */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Cleaning Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Frequency</p>
                    <p className="font-medium text-gray-900">{selectedFrequency?.label}</p>
                    <p className="text-xs text-gray-400">{selectedFrequency?.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contract Length</p>
                    <p className="font-medium text-gray-900">
                      {CONTRACT_DISCOUNTS.find((cd) => cd.months === booking.contractMonths)?.label}
                    </p>
                    {quote && quote.contractDiscount > 0 && (
                      <p className="text-xs font-medium text-green-600">
                        {Math.round(quote.contractDiscount * 100)}% discount applied
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* First Service */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  First Service
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

              {/* Business & Contact */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  Business & Contact
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{booking.businessName}</p>
                  <p className="text-sm text-gray-900">{booking.contactName}</p>
                  <p className="text-sm text-gray-500">{booking.contactEmail}</p>
                  <p className="text-sm text-gray-500">{booking.contactPhone}</p>
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-900">
                    {booking.street}
                    {booking.unit ? `, ${booking.unit}` : ''}
                  </p>
                  <p className="text-sm text-gray-900">
                    {booking.city}, {booking.state} {booking.zipCode}
                  </p>
                </div>
                {booking.specialRequirements && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-500">Special Requirements</p>
                    <p className="text-sm text-gray-900">{booking.specialRequirements}</p>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              {quote && (
                <div className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                    Pricing
                  </h3>
                  <div className="space-y-2">
                    {quote.lineItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className={item.amount < 0 ? 'text-green-600' : 'text-gray-600'}>
                          {item.label}
                        </span>
                        {item.amount !== 0 && (
                          <span className={item.amount < 0 ? 'text-green-600' : 'text-gray-900'}>
                            {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                          </span>
                        )}
                      </div>
                    ))}
                    {quote.perVisitRate > 0 && selectedFrequency && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Per visit (~{selectedFrequency.visitsPerMonth} visits/mo)
                        </span>
                        <span className="text-gray-900">{formatCurrency(quote.perVisitRate)}</span>
                      </div>
                    )}
                    <div className="my-2 border-t border-gray-100" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Monthly subtotal</span>
                      <span className="text-gray-900">{formatCurrency(quote.monthlyRate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tax (8.75%)</span>
                      <span className="text-gray-900">{formatCurrency(quote.monthlyTax)}</span>
                    </div>
                    <div className="my-2 border-t border-gray-100" />
                    <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                      <span>Monthly Total</span>
                      <span>{formatCurrency(quote.monthlyTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Annual estimate</span>
                      <span className="font-medium text-gray-900">{formatCurrency(quote.annualEstimate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Confidence */}
              <ConfidenceBar
                confidence={priceConfidence.percent}
                message={priceConfidence.message}
                aiSuggestion={aiSuggestion}
                aiFactors={aiFactors}
              />

              {/* Price Appeal */}
              {selectedPlan && quote && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Not sure about the price?</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        A technician will review your quote to get a better estimate.
                      </p>
                    </div>
                    <PriceAppealDialog
                      serviceSlug={selectedPlan.slug}
                      serviceName={selectedPlan.name}
                      quotedPrice={quote.monthlyTotal}
                    />
                  </div>
                </div>
              )}

              {/* First Month Payment */}
              {quote && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">First month&apos;s payment</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(quote.monthlyTotal)}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Your first month&apos;s total will be charged to confirm your booking. Subsequent
                    months will be billed automatically.
                  </p>
                </div>
              )}

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-white p-4">
                <input
                  type="checkbox"
                  checked={booking.consentChecked}
                  onChange={(e) => updateBooking('consentChecked', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                  I agree to the service terms. First month&apos;s payment of{' '}
                  {formatCurrency(quote?.monthlyTotal ?? 0)} will be charged.
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
                      Pay {formatCurrency(quote?.monthlyTotal ?? 0)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          router.push(`/portal/bookings/${pendingBookingId}?success=true`)
        }}
        bookingId={pendingBookingId}
        amount={pendingAmount}
        paymentType="full"
        customerEmail={booking.contactEmail}
        serviceName={selectedPlan?.name || 'Office Cleaning'}
      />
    </div>
  )
}

export default function OfficeBookingPage() {
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
      <OfficeBookingPageInner />
    </Suspense>
  )
}
