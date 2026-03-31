// ---------------------------------------------------------------------------
// Smart Recurring Pricing — Yumi Forever
// Uses service history to calculate smarter prices for repeat customers.
// All values in CENTS.
// ---------------------------------------------------------------------------

export type RecurringInterval = 'weekly' | 'biweekly' | 'monthly'

export interface PriorServiceRecord {
  finalPrice: number        // cents
  serviceDate: string       // ISO date
  serviceType: string
  conditionAddons: string[]
  wasAdjusted: boolean
}

export interface RecurringPriceInput {
  standardPrice: number     // cents — current calculated price
  interval: RecurringInterval
  priorService: PriorServiceRecord | null
  isSameAsset: boolean      // same vehicle or same property
}

export interface RecurringPriceResult {
  standardPrice: number     // cents
  recurringPrice: number    // cents
  savingsAmount: number     // cents
  savingsPercent: number    // 0–100
  discountApplied: boolean
  reason: string
}

// ---------------------------------------------------------------------------
// Discount tables — admin-configurable later
// ---------------------------------------------------------------------------

const BASE_RECURRING_DISCOUNT: Record<RecurringInterval, { min: number; max: number }> = {
  weekly: { min: 0.10, max: 0.15 },     // 10–15%
  biweekly: { min: 0.08, max: 0.12 },   // 8–12%
  monthly: { min: 0.05, max: 0.08 },    // 5–8%
}

const MAX_DISCOUNT = 0.15 // cap at 15%
const MIN_DISCOUNT = 0.02 // don't show discount below 2%

// ---------------------------------------------------------------------------
// Smart Recurring Price Calculation
// ---------------------------------------------------------------------------

export function calculateRecurringPrice(input: RecurringPriceInput): RecurringPriceResult {
  const { standardPrice, interval, priorService, isSameAsset } = input

  // No recurring discount if not same asset
  if (!isSameAsset) {
    const discountRange = BASE_RECURRING_DISCOUNT[interval]
    const baseDiscount = discountRange.min
    const discount = Math.min(baseDiscount, MAX_DISCOUNT)

    if (discount < MIN_DISCOUNT) {
      return noDiscount(standardPrice)
    }

    const savingsAmount = Math.round(standardPrice * discount)
    const recurringPrice = roundToNearest10(standardPrice - savingsAmount)

    return {
      standardPrice,
      recurringPrice,
      savingsAmount: standardPrice - recurringPrice,
      savingsPercent: Math.round(((standardPrice - recurringPrice) / standardPrice) * 100),
      discountApplied: true,
      reason: 'Recurring service discount',
    }
  }

  // Same asset — use history for smarter pricing
  if (!priorService) {
    // First time for this asset — give base interval discount
    const discountRange = BASE_RECURRING_DISCOUNT[interval]
    const discount = discountRange.min
    const savingsAmount = Math.round(standardPrice * discount)
    const recurringPrice = roundToNearest10(standardPrice - savingsAmount)

    return {
      standardPrice,
      recurringPrice,
      savingsAmount: standardPrice - recurringPrice,
      savingsPercent: Math.round(((standardPrice - recurringPrice) / standardPrice) * 100),
      discountApplied: true,
      reason: 'Recurring service discount for regular scheduling',
    }
  }

  // Prior service exists — smart pricing
  const daysSinceLastService = daysBetween(priorService.serviceDate, new Date().toISOString())
  const expectedDays = intervalToDays(interval)

  // Calculate discount based on gap vs expected interval
  const discountRange = BASE_RECURRING_DISCOUNT[interval]
  let discount: number

  if (daysSinceLastService <= expectedDays * 1.2) {
    // On schedule or early — give max discount
    discount = discountRange.max
  } else if (daysSinceLastService <= expectedDays * 2) {
    // Slightly late — give mid discount
    discount = (discountRange.min + discountRange.max) / 2
  } else if (daysSinceLastService <= expectedDays * 3) {
    // Very late — give min discount
    discount = discountRange.min
  } else {
    // Too long gap — no recurring discount
    return noDiscount(standardPrice)
  }

  // If prior service had heavy condition add-ons but current doesn't, slightly increase discount
  if (priorService.conditionAddons.length > 0) {
    discount = Math.min(discount + 0.02, MAX_DISCOUNT)
  }

  // If prior service price was adjusted up (worse condition found), reduce discount
  if (priorService.wasAdjusted) {
    discount = Math.max(discount - 0.03, 0)
  }

  if (discount < MIN_DISCOUNT) {
    return noDiscount(standardPrice)
  }

  const savingsAmount = Math.round(standardPrice * discount)
  const recurringPrice = roundToNearest10(standardPrice - savingsAmount)
  const actualSavings = standardPrice - recurringPrice

  let reason = 'Lower maintenance cost due to regular service schedule'
  if (daysSinceLastService <= expectedDays) {
    reason = 'Price adjusted based on your previous completed service'
  }

  return {
    standardPrice,
    recurringPrice,
    savingsAmount: actualSavings,
    savingsPercent: Math.round((actualSavings / standardPrice) * 100),
    discountApplied: true,
    reason,
  }
}

// ---------------------------------------------------------------------------
// Deposit Logic
// ---------------------------------------------------------------------------

export interface DepositConfig {
  amount: number   // cents — fixed deposit amount
  isPercentage: boolean
  percentage: number // 0-100, used if isPercentage is true
}

export const AUTO_DEPOSIT: Record<string, number> = {
  exterior: 2000,    // $20
  interior: 2500,    // $25
  full: 4000,        // $40
  premium: 5000,     // $50
}

export const HOME_DEPOSIT: Record<string, number> = {
  standard: 3000,    // $30
  deep: 4000,        // $40
  move_in_out: 5000, // $50
  carpet: 2000,      // $20
}

export function getDepositAmount(
  category: 'auto_care' | 'home_care',
  serviceType: string,
  totalPrice: number,
): number {
  if (category === 'auto_care') {
    return AUTO_DEPOSIT[serviceType] || Math.round(totalPrice * 0.2)
  }
  if (category === 'home_care') {
    return HOME_DEPOSIT[serviceType] || Math.round(totalPrice * 0.2)
  }
  return Math.round(totalPrice * 0.2)
}

// ---------------------------------------------------------------------------
// Cancellation Policy
// ---------------------------------------------------------------------------

export interface CancellationResult {
  canCancel: boolean
  isRefundable: boolean
  refundableAmount: number
  reason: string
}

export function evaluateCancellationPolicy(
  scheduledDate: string,
  scheduledTime: string,
  depositPaid: number,
  bookingStatus: string,
): CancellationResult {
  // Cannot cancel completed or already canceled bookings
  if (['completed', 'canceled_refundable', 'canceled_nonrefundable'].includes(bookingStatus)) {
    return {
      canCancel: false,
      isRefundable: false,
      refundableAmount: 0,
      reason: 'This booking cannot be canceled.',
    }
  }

  const serviceDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
  const now = new Date()
  const hoursUntilService = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilService > 24) {
    return {
      canCancel: true,
      isRefundable: true,
      refundableAmount: depositPaid,
      reason: 'More than 24 hours before service. Your deposit will be refunded.',
    }
  }

  return {
    canCancel: true,
    isRefundable: false,
    refundableAmount: 0,
    reason: 'Less than 24 hours before service. Deposit is non-refundable per our cancellation policy.',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime()
  const b = new Date(dateB).getTime()
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)))
}

function intervalToDays(interval: RecurringInterval): number {
  switch (interval) {
    case 'weekly': return 7
    case 'biweekly': return 14
    case 'monthly': return 30
  }
}

function roundToNearest10(cents: number): number {
  return Math.round(cents / 1000) * 1000
}

function noDiscount(standardPrice: number): RecurringPriceResult {
  return {
    standardPrice,
    recurringPrice: standardPrice,
    savingsAmount: 0,
    savingsPercent: 0,
    discountApplied: false,
    reason: '',
  }
}
