"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BRAND, OFFICE_PLANS, CONTRACT_DISCOUNTS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type BusinessType = "office" | "medical" | "retail" | "restaurant" | "warehouse" | "gym"
type Frequency = "daily" | "3x_week" | "weekly" | "bi_weekly" | "monthly" | "one_time"
type ServiceTier = "essential" | "professional" | "premier"
type ContactMethod = "phone" | "text" | "email"

const BUSINESS_TYPES: { key: BusinessType; label: string }[] = [
  { key: "office", label: "Office" },
  { key: "medical", label: "Medical / Dental" },
  { key: "retail", label: "Retail" },
  { key: "restaurant", label: "Restaurant" },
  { key: "warehouse", label: "Warehouse" },
  { key: "gym", label: "Gym / Fitness" },
]

const BASE_RATES: Record<BusinessType, number> = {
  office: 12,
  medical: 28,
  retail: 11,
  restaurant: 22,
  warehouse: 7,
  gym: 14,
}

const FREQUENCIES: {
  key: Frequency
  label: string
  factor: number
  visits: number
}[] = [
  { key: "daily", label: "Daily (5x/week)", factor: 0.75, visits: 22 },
  { key: "3x_week", label: "3x / Week", factor: 0.80, visits: 13 },
  { key: "weekly", label: "Weekly", factor: 0.85, visits: 4 },
  { key: "bi_weekly", label: "Bi-Weekly", factor: 0.92, visits: 2 },
  { key: "monthly", label: "Monthly", factor: 1.0, visits: 1 },
  { key: "one_time", label: "One-Time Deep Clean", factor: 1.5, visits: 1 },
]

const TIER_OPTIONS: {
  key: ServiceTier
  label: string
  multiplier: number
  planSlug: string
}[] = [
  { key: "essential", label: "Essential", multiplier: 1.0, planSlug: "yumi-essential" },
  { key: "professional", label: "Professional", multiplier: 1.25, planSlug: "yumi-professional" },
  { key: "premier", label: "Premier", multiplier: 1.65, planSlug: "yumi-premier" },
]

const CONTACT_METHODS: { key: ContactMethod; label: string; icon: typeof Phone }[] = [
  { key: "phone", label: "Phone", icon: Phone },
  { key: "text", label: "Text", icon: MessageSquare },
  { key: "email", label: "Email", icon: Mail },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSizeDiscount(sqft: number): number {
  if (sqft >= 10000) return 0.20
  if (sqft >= 5000) return 0.10
  return 0
}

function getSizeDiscountLabel(sqft: number): string {
  if (sqft >= 10000) return "20% volume discount"
  if (sqft >= 5000) return "10% volume discount"
  return "No volume discount"
}

function calculateQuote(
  businessType: BusinessType,
  sqft: number,
  restrooms: number,
  frequency: Frequency,
  tier: ServiceTier,
  contractMonths: number
) {
  const baseRate = BASE_RATES[businessType]
  const freq = FREQUENCIES.find((f) => f.key === frequency)!
  const tierOption = TIER_OPTIONS.find((t) => t.key === tier)!
  const contractDiscount =
    CONTRACT_DISCOUNTS.find((c) => c.months === contractMonths)?.discount ?? 0
  const sizeDiscount = getSizeDiscount(sqft)

  const frequencyFactor = freq.factor * freq.visits
  const visitsPerMonth = freq.visits

  // Base cleaning cost (cents)
  const baseCost =
    baseRate * sqft * frequencyFactor * tierOption.multiplier * (1 - sizeDiscount)

  // Restroom surcharge (cents): $30 per restroom per visit = 3000 cents
  const restroomCost = restrooms * 3000 * visitsPerMonth

  // Subtotal before contract discount
  const subtotalCents = baseCost + restroomCost

  // Apply contract discount
  const monthlyCents = Math.round(subtotalCents * (1 - contractDiscount))

  // Per-visit cost
  const perVisitCents = visitsPerMonth > 0 ? Math.round(monthlyCents / visitsPerMonth) : monthlyCents

  // Per sq ft rate
  const perSqFtCents = sqft > 0 ? Math.round(monthlyCents / sqft) : 0

  return {
    monthlyCents,
    perVisitCents,
    perSqFtCents,
    visitsPerMonth,
    sizeDiscount,
    contractDiscount,
  }
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  const labels = ["Business Info", "Service Preferences", "Contact Info"]
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#57068C] text-white"
                      : isCompleted
                        ? "bg-[#57068C]/20 text-[#57068C]"
                        : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? "text-[#57068C]"
                      : isCompleted
                        ? "text-neutral-700"
                        : "text-neutral-400"
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    isCompleted ? "bg-[#57068C]/30" : "bg-neutral-200"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function OfficeQuoteCalculatorPage() {
  // Step management
  const [step, setStep] = useState(1)
  const [showResults, setShowResults] = useState(false)

  // Step 1: Business Info
  const [businessType, setBusinessType] = useState<BusinessType>("office")
  const [sqft, setSqft] = useState(2000)
  const [restrooms, setRestrooms] = useState(2)

  // Step 2: Service Preferences
  const [frequency, setFrequency] = useState<Frequency>("weekly")
  const [tier, setTier] = useState<ServiceTier>("professional")
  const [contractMonths, setContractMonths] = useState(12)

  // Step 3: Contact Info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email")

  // Validation
  const isStep1Valid = sqft >= 500 && sqft <= 50000 && restrooms >= 0 && restrooms <= 20
  const isStep2Valid = true
  const isStep3Valid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes("@") &&
    phone.trim().length >= 7

  // Calculate quote
  const quote = useMemo(
    () =>
      calculateQuote(businessType, sqft, restrooms, frequency, tier, contractMonths),
    [businessType, sqft, restrooms, frequency, tier, contractMonths]
  )

  // Get selected plan features
  const selectedPlan = OFFICE_PLANS.find((p) => p.tier === tier)

  // Navigation
  function handleNext() {
    if (step === 1 && isStep1Valid) setStep(2)
    else if (step === 2 && isStep2Valid) setStep(3)
    else if (step === 3 && isStep3Valid) setShowResults(true)
  }

  function handleBack() {
    if (showResults) {
      setShowResults(false)
    } else if (step > 1) {
      setStep(step - 1)
    }
  }

  function handleRecalculate() {
    setShowResults(false)
    setStep(1)
  }

  // -------------------------------------------------------------------------
  // Results View
  // -------------------------------------------------------------------------
  if (showResults) {
    const freqLabel = FREQUENCIES.find((f) => f.key === frequency)!.label
    const businessLabel = BUSINESS_TYPES.find((b) => b.key === businessType)!.label
    const isOneTime = frequency === "one_time"

    return (
      <>
        {/* Hero */}
        <section className="bg-[#57068C] py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <Calculator className="mx-auto h-10 w-10 text-white/80" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your Estimated Quote
            </h1>
            <p className="mt-3 text-lg text-white/80">
              {businessLabel} -- {sqft.toLocaleString()} sq ft -- {freqLabel}
            </p>
          </div>
        </section>

        {/* Results */}
        <section className="bg-neutral-50 py-12 sm:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Price Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
                  {isOneTime ? "Estimated Total" : "Estimated Monthly Price"}
                </p>
                <p className="mt-2 text-5xl font-bold text-[#57068C]">
                  {formatCurrency(quote.monthlyCents)}
                </p>
                {!isOneTime && (
                  <p className="mt-1 text-sm text-neutral-500">per month</p>
                )}
              </div>

              {/* Breakdown */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-neutral-50 p-4 text-center">
                  <p className="text-sm font-medium text-neutral-500">Per Visit</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">
                    {formatCurrency(quote.perVisitCents)}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4 text-center">
                  <p className="text-sm font-medium text-neutral-500">Per Sq Ft / Month</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">
                    {formatCurrency(quote.perSqFtCents)}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 p-4 text-center">
                  <p className="text-sm font-medium text-neutral-500">Visits / Month</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">
                    {quote.visitsPerMonth}
                  </p>
                </div>
              </div>

              {/* Discounts Applied */}
              {(quote.sizeDiscount > 0 || quote.contractDiscount > 0) && (
                <div className="mt-6 rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-800">Discounts Applied:</p>
                  <ul className="mt-1 space-y-1">
                    {quote.sizeDiscount > 0 && (
                      <li className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        {getSizeDiscountLabel(sqft)}
                      </li>
                    )}
                    {quote.contractDiscount > 0 && (
                      <li className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        {(quote.contractDiscount * 100).toFixed(0)}% contract discount
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* What's Included */}
            {selectedPlan && (
              <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-bold text-neutral-900">
                  What&apos;s Included in {selectedPlan.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {selectedPlan.description}
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#57068C]" />
                      <span className="text-sm text-neutral-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                This is an estimate. Final pricing may vary based on specific
                requirements, site conditions, and walk-through assessment.
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-[#57068C] text-white hover:bg-[#57068C]/90" asChild>
                <Link href="/contact">
                  Request Formal Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={`tel:${BRAND.phone.replace(/\D/g, "")}`}>
                  <Phone className="mr-2 h-5 w-5" />
                  Call Us
                </Link>
              </Button>
            </div>

            {/* Recalculate */}
            <div className="mt-6 text-center">
              <button
                onClick={handleRecalculate}
                className="text-sm font-medium text-[#57068C] underline-offset-2 hover:underline"
              >
                Recalculate with different options
              </button>
            </div>
          </div>
        </section>
      </>
    )
  }

  // -------------------------------------------------------------------------
  // Form View
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Hero */}
      <section className="bg-[#57068C] py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
            <Building2 className="h-4 w-4" />
            Office & Commercial
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Get an Instant Quote
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Answer a few questions about your space and receive an estimated
            cleaning price in seconds. No obligation, no credit card required.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-neutral-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <StepIndicator currentStep={step} totalSteps={3} />

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            {/* ----------------------------------------------------------
                Step 1: Business Info
            ---------------------------------------------------------- */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Tell us about your space
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  This helps us calculate an accurate quote for your facility.
                </p>

                {/* Business Type */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-neutral-700">
                    Business Type
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {BUSINESS_TYPES.map((bt) => (
                      <button
                        key={bt.key}
                        type="button"
                        onClick={() => setBusinessType(bt.key)}
                        className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          businessType === bt.key
                            ? "border-[#57068C] bg-[#57068C]/5 text-[#57068C]"
                            : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Square Footage */}
                <div className="mt-6">
                  <label
                    htmlFor="sqft"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Square Footage
                  </label>
                  <input
                    id="sqft"
                    type="number"
                    min={500}
                    max={50000}
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value))}
                    className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-[#57068C] focus:outline-none focus:ring-2 focus:ring-[#57068C]/20"
                    placeholder="e.g. 3000"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Enter a value between 500 and 50,000 sq ft.
                    {sqft >= 5000 && (
                      <span className="ml-1 font-medium text-green-600">
                        {getSizeDiscountLabel(sqft)} applied!
                      </span>
                    )}
                  </p>
                </div>

                {/* Restrooms */}
                <div className="mt-6">
                  <label
                    htmlFor="restrooms"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Number of Restrooms
                  </label>
                  <input
                    id="restrooms"
                    type="number"
                    min={0}
                    max={20}
                    value={restrooms}
                    onChange={(e) => setRestrooms(Number(e.target.value))}
                    className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-[#57068C] focus:outline-none focus:ring-2 focus:ring-[#57068C]/20"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Each restroom adds $30 per visit for thorough sanitization.
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------
                Step 2: Service Preferences
            ---------------------------------------------------------- */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Choose your service preferences
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Select cleaning frequency, service level, and contract length.
                </p>

                {/* Frequency */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-neutral-700">
                    Cleaning Frequency
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFrequency(f.key)}
                        className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                          frequency === f.key
                            ? "border-[#57068C] bg-[#57068C]/5"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium ${
                            frequency === f.key
                              ? "text-[#57068C]"
                              : "text-neutral-700"
                          }`}
                        >
                          {f.label}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {f.visits} visit{f.visits !== 1 ? "s" : ""}/mo
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Tier */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-neutral-700">
                    Service Tier
                  </label>
                  <div className="mt-2 space-y-3">
                    {TIER_OPTIONS.map((t) => {
                      const plan = OFFICE_PLANS.find((p) => p.tier === t.key)
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTier(t.key)}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                            tier === t.key
                              ? "border-[#57068C] bg-[#57068C]/5"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-semibold ${
                                tier === t.key
                                  ? "text-[#57068C]"
                                  : "text-neutral-900"
                              }`}
                            >
                              {plan?.name ?? t.label}
                              {plan?.popular && (
                                <span className="ml-2 inline-block rounded-full bg-[#57068C] px-2 py-0.5 text-xs font-medium text-white">
                                  Popular
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {t.multiplier === 1.0
                                ? "Base price"
                                : `${((t.multiplier - 1) * 100).toFixed(0)}% premium`}
                            </span>
                          </div>
                          {plan && (
                            <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {plan.features.slice(0, 4).map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-center gap-1.5 text-xs text-neutral-500"
                                >
                                  <CheckCircle2 className="h-3 w-3 shrink-0 text-[#57068C]/60" />
                                  {feature}
                                </li>
                              ))}
                              {plan.features.length > 4 && (
                                <li className="text-xs font-medium text-[#57068C]">
                                  +{plan.features.length - 4} more
                                </li>
                              )}
                            </ul>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Contract Length */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-neutral-700">
                    Contract Length
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {CONTRACT_DISCOUNTS.map((cd) => (
                      <button
                        key={cd.months}
                        type="button"
                        onClick={() => setContractMonths(cd.months)}
                        className={`rounded-lg border-2 px-4 py-3 text-center transition-colors ${
                          contractMonths === cd.months
                            ? "border-[#57068C] bg-[#57068C]/5"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium ${
                            contractMonths === cd.months
                              ? "text-[#57068C]"
                              : "text-neutral-700"
                          }`}
                        >
                          {cd.label}
                        </span>
                        {cd.discount > 0 && (
                          <span className="block text-xs font-medium text-green-600">
                            Save {(cd.discount * 100).toFixed(0)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="mt-6 rounded-lg bg-[#57068C]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">
                      Estimated Monthly Price
                    </span>
                    <span className="text-2xl font-bold text-[#57068C]">
                      {formatCurrency(quote.monthlyCents)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatCurrency(quote.perVisitCents)} per visit
                    {" / "}
                    {quote.visitsPerMonth} visit{quote.visitsPerMonth !== 1 ? "s" : ""} per month
                  </p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------
                Step 3: Contact Info
            ---------------------------------------------------------- */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  Where should we send your quote?
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  We will follow up with a detailed proposal and can schedule a
                  free walk-through of your space.
                </p>

                {/* Name */}
                <div className="mt-6">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-[#57068C] focus:outline-none focus:ring-2 focus:ring-[#57068C]/20"
                    placeholder="John Smith"
                  />
                </div>

                {/* Email */}
                <div className="mt-4">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-[#57068C] focus:outline-none focus:ring-2 focus:ring-[#57068C]/20"
                    placeholder="john@company.com"
                  />
                </div>

                {/* Phone */}
                <div className="mt-4">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-[#57068C] focus:outline-none focus:ring-2 focus:ring-[#57068C]/20"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Preferred Contact Method */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-neutral-700">
                    Preferred Contact Method
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {CONTACT_METHODS.map((cm) => (
                      <button
                        key={cm.key}
                        type="button"
                        onClick={() => setContactMethod(cm.key)}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                          contactMethod === cm.key
                            ? "border-[#57068C] bg-[#57068C]/5 text-[#57068C]"
                            : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <cm.icon className="h-4 w-4" />
                        {cm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quote Preview */}
                <div className="mt-6 rounded-lg bg-[#57068C]/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-700">
                      Your Estimated {frequency === "one_time" ? "Total" : "Monthly"} Price
                    </span>
                    <span className="text-2xl font-bold text-[#57068C]">
                      {formatCurrency(quote.monthlyCents)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------
                Navigation Buttons
            ---------------------------------------------------------- */}
            <div className="mt-8 flex items-center justify-between border-t border-neutral-100 pt-6">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !isStep1Valid) ||
                  (step === 3 && !isStep3Valid)
                }
                className="bg-[#57068C] text-white hover:bg-[#57068C]/90 disabled:opacity-50"
              >
                {step === 3 ? "See My Quote" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
