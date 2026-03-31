import { createClient } from '@/lib/supabase/client'
import { HOME_SERVICES, AUTO_SERVICES } from '@/lib/constants'

// =====================================================
// Types
// =====================================================

export type PricingRule = {
  id: string
  rule_type: string
  category: 'home_care' | 'auto_care'
  rule_key: string // mapped from DB column "key"
  value: number
  value_type: 'multiplier' | 'flat_addition' | 'base_price'
  service_id: string | null
  description: string
  is_active: boolean
}

export type HomeFloorplan =
  | 'studio'
  | '1bed_1bath'
  | '2bed_1bath'
  | '2bed_2bath'
  | '3bed_2bath'
  | '4plus_bed'

export type HomeDirtinessLevel = 'light' | 'moderate' | 'heavy' | 'very_heavy'

export type HomeLastCleaned =
  | '1_week'
  | '2_weeks'
  | '1_month'
  | '1_3_months'
  | '3_plus_months'
  | 'not_sure'

export type AutoVehicleClass =
  | 'sedan'
  | 'coupe'
  | 'suv'
  | 'truck'
  | 'van'
  | 'large_suv'
  | 'luxury_exotic'

export type AutoDirtinessLevel = 'light' | 'moderate' | 'heavy' | 'severe'

export type AutoConditions = {
  petHair: boolean
  stains: boolean
  smokeOdor: boolean
  oxidation: boolean
  scratches: boolean
}

export type PricingBreakdownItem = {
  label: string
  amount: number
  type: 'base' | 'multiplier' | 'adjustment'
}

export type PricingResult = {
  basePrice: number
  sqftAdjustment: number
  dirtinessMultiplier: number
  lastCleanedMultiplier: number
  aiAdjustment: number
  subtotal: number
  breakdown: PricingBreakdownItem[]
}

// =====================================================
// Constants
// =====================================================

const AI_MULTIPLIER_MIN = 0.8
const AI_MULTIPLIER_MAX = 2.0
const PRICE_FLOOR_RATIO = 0.5 // 50% of base
const PRICE_CEILING_RATIO = 3.0 // 300% of base

// =====================================================
// Sqft range matching
// =====================================================

/**
 * Sqft ranges defined in the pricing_rules seed data.
 * Each entry maps a rule_key like '0-500' to a numeric range.
 */
const SQFT_RANGES: { key: string; min: number; max: number }[] = [
  { key: '0-500', min: 0, max: 500 },
  { key: '501-1000', min: 501, max: 1000 },
  { key: '1001-1500', min: 1001, max: 1500 },
  { key: '1501-2000', min: 1501, max: 2000 },
  { key: '2001-2500', min: 2001, max: 2500 },
  { key: '2501+', min: 2501, max: Infinity },
]

function findSqftRangeKey(sqft: number): string | null {
  const match = SQFT_RANGES.find((r) => sqft >= r.min && sqft <= r.max)
  return match?.key ?? null
}

// =====================================================
// Helper: find a pricing rule
// =====================================================

function findRule(
  rules: PricingRule[],
  ruleType: string,
  ruleKey: string,
  serviceId?: string
): PricingRule | undefined {
  // Prefer service-specific rule, then generic rule
  return (
    rules.find(
      (r) =>
        r.rule_type === ruleType &&
        r.rule_key === ruleKey &&
        r.is_active &&
        r.service_id === (serviceId ?? null)
    ) ??
    rules.find(
      (r) =>
        r.rule_type === ruleType &&
        r.rule_key === ruleKey &&
        r.is_active &&
        r.service_id === null
    )
  )
}

function findRules(
  rules: PricingRule[],
  ruleType: string
): PricingRule[] {
  return rules.filter((r) => r.rule_type === ruleType && r.is_active)
}

// =====================================================
// Helper: clamp AI multiplier
// =====================================================

function clampAiMultiplier(multiplier: number | null): number {
  if (multiplier === null || multiplier === undefined) return 1.0
  return Math.min(AI_MULTIPLIER_MAX, Math.max(AI_MULTIPLIER_MIN, multiplier))
}

// =====================================================
// Helper: enforce price safety bounds (in cents)
// =====================================================

function enforcePriceBounds(price: number, basePrice: number): number {
  const floor = Math.round(basePrice * PRICE_FLOOR_RATIO)
  const ceiling = Math.round(basePrice * PRICE_CEILING_RATIO)
  return Math.min(ceiling, Math.max(floor, Math.round(price)))
}

// =====================================================
// Helper: look up base price from constants
// =====================================================

function getServiceBasePrice(serviceId: string): number | null {
  // Try to find by slug in HOME_SERVICES or AUTO_SERVICES
  const home = HOME_SERVICES.find((s) => s.slug === serviceId)
  if (home) return home.basePrice

  const auto = AUTO_SERVICES.find((s) => s.slug === serviceId)
  if (auto) return auto.basePrice

  return null
}

// =====================================================
// Map camelCase condition keys to DB rule_keys
// =====================================================

const CONDITION_KEY_MAP: Record<keyof AutoConditions, string> = {
  petHair: 'pet_hair',
  stains: 'stains',
  smokeOdor: 'smoke_odor',
  oxidation: 'oxidation',
  scratches: 'scratches',
}

// =====================================================
// calculateHomePrice
// =====================================================

export function calculateHomePrice(params: {
  serviceId: string
  sqft: number | null
  floorplan: HomeFloorplan | null
  dirtinessLevel: HomeDirtinessLevel
  lastCleaned: HomeLastCleaned
  aiMultiplier: number | null
  pricingRules: PricingRule[]
}): PricingResult {
  const {
    serviceId,
    sqft,
    floorplan,
    dirtinessLevel,
    lastCleaned,
    aiMultiplier,
    pricingRules,
  } = params

  const breakdown: PricingBreakdownItem[] = []

  // ---- Step 1: Determine base price ----
  let basePrice = getServiceBasePrice(serviceId) ?? 0

  // ---- Step 2: Apply floorplan or sqft adjustment ----
  let sqftAdjustment = 0

  if (floorplan) {
    // Floorplan replaces the base price
    const floorplanRule = findRule(pricingRules, 'home_floorplan', floorplan, serviceId)
    if (floorplanRule && floorplanRule.value_type === 'base_price') {
      basePrice = Math.round(floorplanRule.value)
      breakdown.push({
        label: `Floorplan: ${floorplanRule.description}`,
        amount: basePrice,
        type: 'base',
      })
    } else {
      breakdown.push({
        label: 'Service base price',
        amount: basePrice,
        type: 'base',
      })
    }
  } else if (sqft !== null && sqft > 0) {
    // Sqft applies a multiplier on the base price
    breakdown.push({
      label: 'Service base price',
      amount: basePrice,
      type: 'base',
    })

    const rangeKey = findSqftRangeKey(sqft)
    if (rangeKey) {
      const sqftRule = findRule(pricingRules, 'home_sqft', rangeKey, serviceId)
      if (sqftRule) {
        if (sqftRule.value_type === 'multiplier') {
          // sqft rules in the DB are multipliers (e.g., 0.85, 1.0, 1.15)
          const multiplierDelta = sqftRule.value - 1.0
          sqftAdjustment = Math.round(basePrice * multiplierDelta)
          if (sqftAdjustment !== 0) {
            breakdown.push({
              label: `Sqft adjustment (${sqft} sqft): ${sqftRule.description}`,
              amount: sqftAdjustment,
              type: 'adjustment',
            })
          }
        } else if (sqftRule.value_type === 'flat_addition') {
          sqftAdjustment = Math.round(sqftRule.value)
          if (sqftAdjustment !== 0) {
            breakdown.push({
              label: `Sqft adjustment (${sqft} sqft): ${sqftRule.description}`,
              amount: sqftAdjustment,
              type: 'adjustment',
            })
          }
        }
      }
    }
  } else {
    breakdown.push({
      label: 'Service base price',
      amount: basePrice,
      type: 'base',
    })
  }

  // The effective base for multiplier calculations
  const effectiveBase = basePrice + sqftAdjustment

  // ---- Step 3: Apply dirtiness multiplier ----
  let dirtinessMultiplier = 1.0
  const dirtinessRule = findRule(pricingRules, 'home_dirtiness', dirtinessLevel, serviceId)
  if (dirtinessRule) {
    dirtinessMultiplier = dirtinessRule.value
    if (dirtinessMultiplier !== 1.0) {
      breakdown.push({
        label: `Dirtiness (${dirtinessLevel}): ${dirtinessRule.description}`,
        amount: dirtinessMultiplier,
        type: 'multiplier',
      })
    }
  }

  // ---- Step 4: Apply last_cleaned multiplier ----
  let lastCleanedMultiplier = 1.0
  const lastCleanedRule = findRule(pricingRules, 'home_last_cleaned', lastCleaned, serviceId)
  if (lastCleanedRule) {
    lastCleanedMultiplier = lastCleanedRule.value
    if (lastCleanedMultiplier !== 1.0) {
      breakdown.push({
        label: `Last cleaned (${lastCleaned}): ${lastCleanedRule.description}`,
        amount: lastCleanedMultiplier,
        type: 'multiplier',
      })
    }
  }

  // ---- Step 5: Apply AI multiplier ----
  const clampedAi = clampAiMultiplier(aiMultiplier)
  const aiAdjustmentMultiplier = clampedAi
  let aiAdjustment = 0

  if (aiMultiplier !== null && clampedAi !== 1.0) {
    breakdown.push({
      label: `AI adjustment (x${clampedAi.toFixed(2)})`,
      amount: clampedAi,
      type: 'multiplier',
    })
  }

  // ---- Step 6: Calculate subtotal ----
  const combinedMultiplier = dirtinessMultiplier * lastCleanedMultiplier * aiAdjustmentMultiplier
  let subtotal = Math.round(effectiveBase * combinedMultiplier)

  // Calculate AI adjustment as the delta attributable to AI
  if (aiMultiplier !== null && clampedAi !== 1.0) {
    const subtotalWithoutAi = Math.round(effectiveBase * dirtinessMultiplier * lastCleanedMultiplier)
    aiAdjustment = subtotal - subtotalWithoutAi
  }

  // ---- Step 7: Enforce safety bounds ----
  subtotal = enforcePriceBounds(subtotal, basePrice)

  return {
    basePrice,
    sqftAdjustment,
    dirtinessMultiplier,
    lastCleanedMultiplier,
    aiAdjustment,
    subtotal,
    breakdown,
  }
}

// =====================================================
// calculateAutoPrice
// =====================================================

export function calculateAutoPrice(params: {
  serviceId: string
  vehicleClass: AutoVehicleClass
  dirtinessLevel: AutoDirtinessLevel
  conditions: AutoConditions
  aiMultiplier: number | null
  pricingRules: PricingRule[]
}): PricingResult {
  const {
    serviceId,
    vehicleClass,
    dirtinessLevel,
    conditions,
    aiMultiplier,
    pricingRules,
  } = params

  const breakdown: PricingBreakdownItem[] = []

  // ---- Step 1: Determine base price ----
  const basePrice = getServiceBasePrice(serviceId) ?? 0
  breakdown.push({
    label: 'Service base price',
    amount: basePrice,
    type: 'base',
  })

  // ---- Step 2: Apply vehicle class multiplier ----
  let vehicleClassMultiplier = 1.0
  const vehicleRule = findRule(pricingRules, 'auto_vehicle_class', vehicleClass, serviceId)
  if (vehicleRule) {
    vehicleClassMultiplier = vehicleRule.value
    if (vehicleClassMultiplier !== 1.0) {
      breakdown.push({
        label: `Vehicle class (${vehicleClass}): ${vehicleRule.description}`,
        amount: vehicleClassMultiplier,
        type: 'multiplier',
      })
    }
  }

  // ---- Step 3: Apply dirtiness multiplier ----
  let dirtinessMultiplier = 1.0
  const dirtinessRule = findRule(pricingRules, 'auto_dirtiness', dirtinessLevel, serviceId)
  if (dirtinessRule) {
    dirtinessMultiplier = dirtinessRule.value
    if (dirtinessMultiplier !== 1.0) {
      breakdown.push({
        label: `Dirtiness (${dirtinessLevel}): ${dirtinessRule.description}`,
        amount: dirtinessMultiplier,
        type: 'multiplier',
      })
    }
  }

  // ---- Step 4: Apply condition surcharges (flat additions) ----
  let conditionSurchargeTotal = 0
  const conditionEntries = Object.entries(conditions) as [keyof AutoConditions, boolean][]

  for (const [conditionKey, isActive] of conditionEntries) {
    if (!isActive) continue

    const dbKey = CONDITION_KEY_MAP[conditionKey]
    const conditionRule = findRule(pricingRules, 'auto_condition', dbKey, serviceId)
    if (conditionRule && conditionRule.value > 0) {
      const surcharge = Math.round(conditionRule.value)
      conditionSurchargeTotal += surcharge
      breakdown.push({
        label: `Condition add-on (${dbKey}): ${conditionRule.description}`,
        amount: surcharge,
        type: 'adjustment',
      })
    }
  }

  // ---- Step 5: Apply AI multiplier ----
  const clampedAi = clampAiMultiplier(aiMultiplier)
  let aiAdjustment = 0

  if (aiMultiplier !== null && clampedAi !== 1.0) {
    breakdown.push({
      label: `AI adjustment (x${clampedAi.toFixed(2)})`,
      amount: clampedAi,
      type: 'multiplier',
    })
  }

  // ---- Step 6: Calculate subtotal ----
  // Multipliers apply to the base price, then add flat surcharges
  const combinedMultiplier = vehicleClassMultiplier * dirtinessMultiplier * clampedAi
  let subtotal = Math.round(basePrice * combinedMultiplier) + conditionSurchargeTotal

  // Calculate AI adjustment as the delta attributable to AI
  if (aiMultiplier !== null && clampedAi !== 1.0) {
    const subtotalWithoutAi =
      Math.round(basePrice * vehicleClassMultiplier * dirtinessMultiplier) +
      conditionSurchargeTotal
    aiAdjustment = subtotal - subtotalWithoutAi
  }

  // sqftAdjustment is not applicable for auto, use it for vehicle class delta
  const sqftAdjustment =
    vehicleClassMultiplier !== 1.0
      ? Math.round(basePrice * (vehicleClassMultiplier - 1.0))
      : 0

  // ---- Step 7: Enforce safety bounds ----
  subtotal = enforcePriceBounds(subtotal, basePrice)

  // lastCleanedMultiplier is not applicable for auto, default to 1.0
  const lastCleanedMultiplier = 1.0

  return {
    basePrice,
    sqftAdjustment,
    dirtinessMultiplier,
    lastCleanedMultiplier,
    aiAdjustment,
    subtotal,
    breakdown,
  }
}

// =====================================================
// fetchPricingRules
// =====================================================

/**
 * Fetches all active pricing rules from Supabase.
 * Works client-side using the browser Supabase client.
 *
 * The DB table uses "key" as the column name, which we map
 * to "rule_key" in our PricingRule type to avoid confusion
 * with JavaScript reserved words.
 */
export async function fetchPricingRules(
  category?: 'home_care' | 'auto_care'
): Promise<PricingRule[]> {
  const supabase = createClient()

  let query = supabase
    .from('pricing_rules')
    .select('id, rule_type, category, key, value, value_type, service_id, description, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch pricing rules:', error.message)
    return []
  }

  // Map the DB "key" column to our "rule_key" field
  return (data ?? []).map((row) => ({
    id: row.id as string,
    rule_type: row.rule_type as string,
    category: row.category as 'home_care' | 'auto_care',
    rule_key: row.key as string,
    value: Number(row.value),
    value_type: row.value_type as 'multiplier' | 'flat_addition' | 'base_price',
    service_id: (row.service_id as string) ?? null,
    description: (row.description as string) ?? '',
    is_active: row.is_active as boolean,
  }))
}

// =====================================================
// Utility: format price for display
// =====================================================

/**
 * Converts a price in cents to a formatted dollar string.
 * Example: 14900 -> "$149.00"
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
