// ---------------------------------------------------------------------------
// Pricing Engine — Yumi Forever
// All prices stored and calculated in CENTS. Round final to nearest $10.
// ---------------------------------------------------------------------------

import { TAX_RATE } from './constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VehicleClass = 'sedan' | 'small_suv' | 'large_suv' | 'truck_van'
export type AutoServiceType = 'exterior' | 'interior' | 'full' | 'premium' | 'paint_enhancement'
export type AutoCondition = 'light' | 'daily' | 'extra_care' | 'heavy'
export type AutoConditionAddon = 'pet_hair' | 'stains' | 'smoke' | 'sand_mud'

export type HomeFloorplan = 'studio' | '1bed_1bath' | '2bed_1bath' | '2bed_2bath' | '3bed_plus'
export type HomeServiceType = 'standard' | 'deep' | 'move_in_out' | 'carpet'
export type HomeDirtiness = 'light' | 'moderate' | 'heavy' | 'very_heavy'
export type HomeLastCleaned = '1_week' | '2_weeks' | '1_month' | '1_3_months' | '3_plus_months' | 'not_sure'
export type HomeCarpetType = 'none' | 'bedroom_only' | 'throughout'
export type HomeBuildingType = 'apartment' | 'house' | 'townhouse'

export interface AutoPriceInput {
  vehicleClass: VehicleClass
  serviceType: AutoServiceType
  condition: AutoCondition
  conditionAddons: AutoConditionAddon[]
}

export interface HomePriceInput {
  floorplan?: HomeFloorplan
  sqft?: number
  bedrooms?: number
  bathrooms?: number
  serviceType: HomeServiceType
  dirtiness: HomeDirtiness
  lastCleaned: HomeLastCleaned
  carpetType?: HomeCarpetType
  buildingType?: HomeBuildingType
}

export interface PriceBreakdown {
  baseAmount: number      // cents
  addons: number          // cents (condition addons or service addon)
  multiplier: number      // combined multiplier
  subtotal: number        // cents (before tax, after rounding)
  tax: number             // cents
  total: number           // cents
  label: string           // human-readable formula summary
  lineItems: { label: string; amount: number }[]
}

// ---------------------------------------------------------------------------
// Auto Pricing Tables (all in cents)
// ---------------------------------------------------------------------------

export const VEHICLE_BASE_PRICE: Record<VehicleClass, number> = {
  sedan: 14000,      // $140
  small_suv: 18000,  // $180
  large_suv: 22000,  // $220
  truck_van: 26000,  // $260
}

export const AUTO_SERVICE_ADDON: Record<AutoServiceType, number> = {
  exterior: 0,              // $0
  interior: 6000,           // $60
  full: 14000,              // $140
  premium: 24000,           // $240
  paint_enhancement: 18000, // $180
}

export const AUTO_CONDITION_MULTIPLIER: Record<AutoCondition, number> = {
  light: 1.0,
  daily: 1.15,
  extra_care: 1.35,
  heavy: 1.55,
}

export const AUTO_CONDITION_ADDON_PRICE: Record<AutoConditionAddon, number> = {
  pet_hair: 7500,    // $75
  stains: 6000,      // $60
  smoke: 12000,      // $120
  sand_mud: 6000,    // $60
}

// ---------------------------------------------------------------------------
// Home Pricing Tables (all in cents)
// ---------------------------------------------------------------------------

export const HOME_FLOORPLAN_BASE: Record<HomeFloorplan, number> = {
  studio: 13000,        // $130
  '1bed_1bath': 15500,  // $155
  '2bed_1bath': 18000,  // $180
  '2bed_2bath': 20000,  // $200
  '3bed_plus': 25000,   // $250
}

export const HOME_SERVICE_MULTIPLIER: Record<HomeServiceType, number> = {
  standard: 1.0,
  deep: 1.6,
  move_in_out: 2.0,
  carpet: 0.8,
}

export const HOME_DIRTINESS_MULTIPLIER: Record<HomeDirtiness, number> = {
  light: 1.0,
  moderate: 1.15,
  heavy: 1.3,
  very_heavy: 1.55,
}

// Sqft-based pricing (alternative to floorplan)
export const HOME_SQFT_BASE: { maxSqft: number; price: number; label: string }[] = [
  { maxSqft: 800,   price: 13000, label: 'Under 800 sqft' },
  { maxSqft: 1200,  price: 16500, label: '800–1,200 sqft' },
  { maxSqft: 1800,  price: 20000, label: '1,200–1,800 sqft' },
  { maxSqft: 2500,  price: 25000, label: '1,800–2,500 sqft' },
  { maxSqft: Infinity, price: 32000, label: '2,500+ sqft' },
]

export function getSqftBasePrice(sqft: number): number {
  for (const tier of HOME_SQFT_BASE) {
    if (sqft <= tier.maxSqft) return tier.price
  }
  return HOME_SQFT_BASE[HOME_SQFT_BASE.length - 1].price
}

export function getSqftLabel(sqft: number): string {
  for (const tier of HOME_SQFT_BASE) {
    if (sqft <= tier.maxSqft) return tier.label
  }
  return HOME_SQFT_BASE[HOME_SQFT_BASE.length - 1].label
}

export const HOME_LAST_CLEANED_MULTIPLIER: Record<HomeLastCleaned, number> = {
  '1_week': 1.0,
  '2_weeks': 1.0,
  '1_month': 1.1,
  '1_3_months': 1.2,
  '3_plus_months': 1.35,
  not_sure: 1.15,
}

export const HOME_CARPET_MULTIPLIER: Record<HomeCarpetType, number> = {
  none: 0.92,         // hardwood/tile only — easier, less time
  bedroom_only: 1.0,  // standard
  throughout: 1.12,   // full carpet — more vacuuming/extraction
}

export const HOME_BUILDING_MULTIPLIER: Record<HomeBuildingType, number> = {
  apartment: 1.0,     // standard
  townhouse: 1.05,    // stairs, slightly more area
  house: 1.1,         // more area, multiple floors, garage access
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const VEHICLE_CLASS_LABEL: Record<VehicleClass, string> = {
  sedan: 'Sedan / Coupe',
  small_suv: 'Small SUV / Crossover',
  large_suv: 'Large SUV / Full-Size',
  truck_van: 'Truck / Van',
}

export const AUTO_SERVICE_LABEL: Record<AutoServiceType, string> = {
  exterior: 'Exterior Wash',
  interior: 'Interior Detail',
  full: 'Full Detail',
  premium: 'Premium Detail',
  paint_enhancement: 'Paint Enhancement',
}

export const AUTO_CONDITION_LABEL: Record<AutoCondition, string> = {
  light: 'Light — well maintained',
  daily: 'Daily driver — normal wear',
  extra_care: 'Extra care needed',
  heavy: 'Heavy — deep cleaning needed',
}

export const AUTO_CONDITION_ADDON_LABEL: Record<AutoConditionAddon, string> = {
  pet_hair: 'Pet Hair Removal',
  stains: 'Stain Treatment',
  smoke: 'Smoke/Odor Treatment',
  sand_mud: 'Sand/Mud Removal',
}

export const HOME_FLOORPLAN_LABEL: Record<HomeFloorplan, string> = {
  studio: 'Studio',
  '1bed_1bath': '1 Bed / 1 Bath',
  '2bed_1bath': '2 Bed / 1 Bath',
  '2bed_2bath': '2 Bed / 2 Bath',
  '3bed_plus': '3+ Bedrooms',
}

export const HOME_SERVICE_LABEL: Record<HomeServiceType, string> = {
  standard: 'Standard Cleaning',
  deep: 'Deep Cleaning',
  move_in_out: 'Move-In / Move-Out',
  carpet: 'Carpet Cleaning',
}

export const HOME_DIRTINESS_LABEL: Record<HomeDirtiness, string> = {
  light: 'Light — recently cleaned',
  moderate: 'Moderate — some buildup',
  heavy: 'Heavy — significant buildup',
  very_heavy: 'Very heavy — deep clean needed',
}

export const HOME_LAST_CLEANED_LABEL: Record<HomeLastCleaned, string> = {
  '1_week': 'Within 1 week',
  '2_weeks': 'Within 2 weeks',
  '1_month': 'About 1 month ago',
  '1_3_months': '1–3 months ago',
  '3_plus_months': '3+ months ago',
  not_sure: 'Not sure',
}

export const HOME_CARPET_LABEL: Record<HomeCarpetType, string> = {
  none: 'No carpet (hardwood / tile)',
  bedroom_only: 'Carpet in bedrooms only',
  throughout: 'Carpet throughout',
}

export const HOME_BUILDING_LABEL: Record<HomeBuildingType, string> = {
  apartment: 'Apartment / Condo',
  house: 'House',
  townhouse: 'Townhouse',
}

// ---------------------------------------------------------------------------
// Rounding: nearest $10 (1000 cents)
// ---------------------------------------------------------------------------

function roundToNearest10(cents: number): number {
  return Math.round(cents / 1000) * 1000
}

// ---------------------------------------------------------------------------
// Auto Price Calculation
// price = (vehicle_base + service_addon + condition_addons) × condition_multiplier
// ---------------------------------------------------------------------------

export function calculateAutoPrice(input: AutoPriceInput): PriceBreakdown {
  const vehicleBase = VEHICLE_BASE_PRICE[input.vehicleClass]
  const serviceAddon = AUTO_SERVICE_ADDON[input.serviceType]
  const conditionMultiplier = AUTO_CONDITION_MULTIPLIER[input.condition]

  let conditionAddonsTotal = 0
  const lineItems: { label: string; amount: number }[] = []

  lineItems.push({ label: `Vehicle: ${VEHICLE_CLASS_LABEL[input.vehicleClass]}`, amount: vehicleBase })
  if (serviceAddon > 0) {
    lineItems.push({ label: `Service: ${AUTO_SERVICE_LABEL[input.serviceType]}`, amount: serviceAddon })
  }

  for (const addon of input.conditionAddons) {
    const price = AUTO_CONDITION_ADDON_PRICE[addon]
    conditionAddonsTotal += price
    lineItems.push({ label: AUTO_CONDITION_ADDON_LABEL[addon], amount: price })
  }

  const rawSubtotal = (vehicleBase + serviceAddon + conditionAddonsTotal) * conditionMultiplier
  const subtotal = roundToNearest10(rawSubtotal)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  return {
    baseAmount: vehicleBase + serviceAddon,
    addons: conditionAddonsTotal,
    multiplier: conditionMultiplier,
    subtotal,
    tax,
    total,
    label: `(${formatDollars(vehicleBase)} + ${formatDollars(serviceAddon)} + ${formatDollars(conditionAddonsTotal)}) × ${conditionMultiplier}`,
    lineItems,
  }
}

// ---------------------------------------------------------------------------
// Home Price Calculation
// price = base × service_multiplier × dirtiness × last_cleaned
// ---------------------------------------------------------------------------

export function calculateHomePrice(input: HomePriceInput): PriceBreakdown {
  // Support sqft-based or floorplan-based pricing
  let base: number
  let sizeLabel: string

  if (input.sqft && input.sqft > 0) {
    base = getSqftBasePrice(input.sqft)
    sizeLabel = `${input.sqft.toLocaleString()} sqft`
  } else if (input.floorplan) {
    base = HOME_FLOORPLAN_BASE[input.floorplan]
    sizeLabel = HOME_FLOORPLAN_LABEL[input.floorplan]
  } else {
    base = HOME_FLOORPLAN_BASE['studio']
    sizeLabel = 'Studio (default)'
  }

  // Room-based adjustments — only apply when using floorplan (not sqft)
  // because sqft already captures the total space size
  const bedrooms = input.bedrooms || 0
  const bathrooms = input.bathrooms || 0
  let roomAddon = 0
  const usingSqft = !!(input.sqft && input.sqft > 0)
  if (!usingSqft) {
    if (bedrooms > 0) {
      // $20 per bedroom
      roomAddon += bedrooms * 2000
    }
    if (bathrooms > 0) {
      // $25 per bathroom (bathrooms are more labor-intensive)
      roomAddon += bathrooms * 2500
    }
  }

  const serviceMultiplier = HOME_SERVICE_MULTIPLIER[input.serviceType]
  const dirtinessMultiplier = HOME_DIRTINESS_MULTIPLIER[input.dirtiness]
  const lastCleanedMultiplier = HOME_LAST_CLEANED_MULTIPLIER[input.lastCleaned]
  const carpetMultiplier = input.carpetType ? HOME_CARPET_MULTIPLIER[input.carpetType] : 1.0
  const buildingMultiplier = input.buildingType ? HOME_BUILDING_MULTIPLIER[input.buildingType] : 1.0

  const combinedMultiplier = serviceMultiplier * dirtinessMultiplier * lastCleanedMultiplier * carpetMultiplier * buildingMultiplier

  const lineItems: { label: string; amount: number }[] = [
    { label: `Home: ${sizeLabel}`, amount: base },
  ]

  if (!usingSqft && bedrooms > 0) {
    lineItems.push({ label: `${bedrooms} bedroom${bedrooms > 1 ? 's' : ''} (+$${(bedrooms * 20)})`, amount: bedrooms * 2000 })
  }
  if (!usingSqft && bathrooms > 0) {
    lineItems.push({ label: `${bathrooms} bathroom${bathrooms > 1 ? 's' : ''} (+$${(bathrooms * 25)})`, amount: bathrooms * 2500 })
  }

  if (serviceMultiplier !== 1) {
    lineItems.push({ label: `Service: ${HOME_SERVICE_LABEL[input.serviceType]} (×${serviceMultiplier})`, amount: 0 })
  }
  if (input.carpetType && carpetMultiplier !== 1) {
    lineItems.push({ label: `Flooring: ${HOME_CARPET_LABEL[input.carpetType]} (×${carpetMultiplier})`, amount: 0 })
  }
  if (input.buildingType && buildingMultiplier !== 1) {
    lineItems.push({ label: `Building: ${HOME_BUILDING_LABEL[input.buildingType]} (×${buildingMultiplier})`, amount: 0 })
  }

  const rawSubtotal = (base + roomAddon) * combinedMultiplier
  const subtotal = roundToNearest10(rawSubtotal)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  return {
    baseAmount: base + roomAddon,
    addons: roomAddon,
    multiplier: combinedMultiplier,
    subtotal,
    tax,
    total,
    label: `(${formatDollars(base)} + ${formatDollars(roomAddon)}) × ${serviceMultiplier} × ${dirtinessMultiplier} × ${lastCleanedMultiplier} × ${carpetMultiplier} × ${buildingMultiplier}`,
    lineItems,
  }
}

// ---------------------------------------------------------------------------
// Price Range (for display on pricing/services pages)
// ---------------------------------------------------------------------------

/** Returns min–max price range for an auto service (varies by vehicle class & condition) */
export function getAutoServicePriceRange(serviceType: AutoServiceType): { min: number; max: number } {
  const vehicleClasses: VehicleClass[] = ['sedan', 'small_suv', 'large_suv', 'truck_van']
  const conditions: AutoCondition[] = ['light', 'heavy']
  let min = Infinity
  let max = 0
  for (const vc of vehicleClasses) {
    for (const cond of conditions) {
      const result = calculateAutoPrice({ vehicleClass: vc, serviceType, condition: cond, conditionAddons: [] })
      if (result.subtotal < min) min = result.subtotal
      if (result.subtotal > max) max = result.subtotal
    }
  }
  return { min, max }
}

/** Returns min–max price range for a home service (varies by sqft range & dirtiness) */
export function getHomeServicePriceRange(serviceType: HomeServiceType): { min: number; max: number } {
  const sqftOptions = [500, 2800] // smallest and largest
  const dirtiness: HomeDirtiness[] = ['light', 'very_heavy']
  const lastCleaned: HomeLastCleaned[] = ['1_week', '3_plus_months']
  let min = Infinity
  let max = 0
  for (const sqft of sqftOptions) {
    for (const d of dirtiness) {
      for (const lc of lastCleaned) {
        const result = calculateHomePrice({ sqft, serviceType, dirtiness: d, lastCleaned: lc })
        if (result.subtotal < min) min = result.subtotal
        if (result.subtotal > max) max = result.subtotal
      }
    }
  }
  return { min, max }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

/** Duration estimates in minutes based on service + size */
export function estimateAutoDuration(serviceType: AutoServiceType, vehicleClass: VehicleClass): number {
  const baseDuration: Record<AutoServiceType, number> = {
    exterior: 45,
    interior: 90,
    full: 150,
    premium: 210,
    paint_enhancement: 180,
  }
  const sizeMultiplier: Record<VehicleClass, number> = {
    sedan: 1.0,
    small_suv: 1.1,
    large_suv: 1.25,
    truck_van: 1.3,
  }
  return Math.round(baseDuration[serviceType] * sizeMultiplier[vehicleClass])
}

export function estimateHomeDuration(serviceType: HomeServiceType, floorplan: HomeFloorplan): number {
  const baseDuration: Record<HomeServiceType, number> = {
    standard: 90,
    deep: 180,
    move_in_out: 240,
    carpet: 90,
  }
  const sizeMultiplier: Record<HomeFloorplan, number> = {
    studio: 0.7,
    '1bed_1bath': 0.85,
    '2bed_1bath': 1.0,
    '2bed_2bath': 1.15,
    '3bed_plus': 1.4,
  }
  return Math.round(baseDuration[serviceType] * sizeMultiplier[floorplan])
}

// ---------------------------------------------------------------------------
// Price Confidence — tells the user how likely the price is to change
// ---------------------------------------------------------------------------

export interface PriceConfidence {
  percent: number // 0–99 (capped — predictions are never 100% accurate)
  missing: { field: string; impact: string }[]
  message: string
}

export function getHomePriceConfidence(input: {
  hasFloorplanOrSqft: boolean
  hasBedrooms: boolean
  hasBathrooms: boolean
  hasCarpetType: boolean
  hasBuildingType: boolean
  hasDirtiness: boolean
  hasLastCleaned: boolean
  hasSpecialNotes?: boolean
  aiAdjustment?: number
}): PriceConfidence {
  const missing: { field: string; impact: string }[] = []
  let confidence = 100

  if (!input.hasFloorplanOrSqft) {
    missing.push({ field: 'Home size', impact: 'Price could vary up to 50%' })
    confidence -= 35
  }
  if (!input.hasBedrooms || !input.hasBathrooms) {
    missing.push({ field: 'Room count', impact: 'Price may adjust +$25-35 per room' })
    confidence -= 10
  }
  if (!input.hasCarpetType) {
    missing.push({ field: 'Flooring type', impact: 'Price may adjust ±8%' })
    confidence -= 8
  }
  if (!input.hasBuildingType) {
    missing.push({ field: 'Building type', impact: 'Price may adjust up to +10%' })
    confidence -= 7
  }
  if (!input.hasDirtiness) {
    missing.push({ field: 'Condition level', impact: 'Price could increase up to 55%' })
    confidence -= 25
  }
  if (!input.hasLastCleaned) {
    missing.push({ field: 'Last cleaned date', impact: 'Price may adjust up to +35%' })
    confidence -= 15
  }

  // AI can only LOWER confidence (reveals complexity), never raise it
  if (input.aiAdjustment && input.aiAdjustment < 0) {
    confidence += input.aiAdjustment
  }

  confidence = Math.max(0, Math.min(95, confidence))

  let message: string
  if (confidence >= 85) {
    message = 'High accuracy — this quote is very close to your final price.'
  } else if (confidence >= 75) {
    message = 'Good estimate — final price may vary slightly based on missing details.'
  } else if (confidence >= 65) {
    message = 'Fair estimate — providing more details will improve accuracy.'
  } else if (confidence >= 50) {
    message = 'Rough estimate — fill in more details for a better quote.'
  } else {
    message = 'Very rough estimate — please fill in more details for an accurate quote.'
  }

  return { percent: confidence, missing, message }
}

// ---------------------------------------------------------------------------
// Auto Price Confidence
// ---------------------------------------------------------------------------

export function getAutoPriceConfidence(input: {
  hasVehicleType: boolean
  hasServiceType: boolean
  hasCondition: boolean
  hasAddons: boolean
  hasSpecialNotes?: boolean
  aiAdjustment?: number
}): PriceConfidence {
  const missing: { field: string; impact: string }[] = []
  let confidence = 100

  if (!input.hasVehicleType) {
    missing.push({ field: 'Vehicle type', impact: 'Price varies up to $120 by vehicle size' })
    confidence -= 25
  }
  if (!input.hasServiceType) {
    missing.push({ field: 'Service type', impact: 'Price varies from $140 to $900+' })
    confidence -= 20
  }
  if (!input.hasCondition) {
    missing.push({ field: 'Vehicle condition', impact: 'Price could increase up to 55%' })
    confidence -= 20
  }
  if (!input.hasAddons) {
    missing.push({ field: 'Add-ons', impact: 'Additional services may add $60-$180' })
    confidence -= 5
  }

  // AI can only LOWER confidence (reveals complexity), never raise it
  if (input.aiAdjustment && input.aiAdjustment < 0) {
    confidence += input.aiAdjustment
  }

  confidence = Math.max(0, Math.min(99, confidence))

  let message: string
  if (confidence >= 90) {
    message = 'High accuracy — this quote is very close to your final price.'
  } else if (confidence >= 75) {
    message = 'Good estimate — final price may vary slightly based on vehicle condition.'
  } else if (confidence >= 65) {
    message = 'Fair estimate — providing more details will improve accuracy.'
  } else if (confidence >= 50) {
    message = 'Rough estimate — fill in more details for a better quote.'
  } else {
    message = 'Very rough estimate — please fill in more details for an accurate quote.'
  }

  return { percent: confidence, missing, message }
}

// ---------------------------------------------------------------------------
// Office Price Confidence
// ---------------------------------------------------------------------------

export function getOfficePriceConfidence(input: {
  hasBusinessType: boolean
  hasSpaceSize: boolean
  hasRestrooms: boolean
  hasServiceLevel: boolean
  hasFrequency: boolean
  hasContract: boolean
  hasSpecialNotes?: boolean
  aiAdjustment?: number
}): PriceConfidence {
  const missing: { field: string; impact: string }[] = []
  let confidence = 100

  if (!input.hasBusinessType) {
    missing.push({ field: 'Business type', impact: 'Industry multipliers range from 0.7x to 1.55x' })
    confidence -= 15
  }
  if (!input.hasSpaceSize) {
    missing.push({ field: 'Space size', impact: 'Biggest price driver — varies widely' })
    confidence -= 30
  }
  if (!input.hasRestrooms) {
    missing.push({ field: 'Restroom count', impact: '$15 per restroom per visit' })
    confidence -= 5
  }
  if (!input.hasServiceLevel) {
    missing.push({ field: 'Service level', impact: 'Essential vs Premier varies significantly' })
    confidence -= 15
  }
  if (!input.hasFrequency) {
    missing.push({ field: 'Cleaning frequency', impact: 'Frequency discounts up to 35%' })
    confidence -= 10
  }
  if (!input.hasContract) {
    missing.push({ field: 'Contract length', impact: 'Contract discounts up to 15%' })
    confidence -= 5
  }

  // AI can only LOWER confidence (reveals complexity), never raise it
  if (input.aiAdjustment && input.aiAdjustment < 0) {
    confidence += input.aiAdjustment
  }

  confidence = Math.max(0, Math.min(95, confidence))

  let message: string
  if (confidence >= 85) {
    message = 'High accuracy — this quote is very close to your final price.'
  } else if (confidence >= 75) {
    message = 'Good estimate — final price may vary slightly based on space details.'
  } else if (confidence >= 65) {
    message = 'Fair estimate — providing more details will improve accuracy.'
  } else if (confidence >= 50) {
    message = 'Rough estimate — fill in more details for a better quote.'
  } else {
    message = 'Very rough estimate — please fill in more details for an accurate quote.'
  }

  return { percent: confidence, missing, message }
}

/** Returns the CSS color class for a given confidence percentage */
export function getConfidenceColor(percent: number): string {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 65) return 'bg-yellow-500'
  if (percent >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

/** Returns the text color class for a given confidence percentage */
export function getConfidenceTextColor(percent: number): string {
  if (percent >= 80) return 'text-green-700'
  if (percent >= 65) return 'text-yellow-700'
  if (percent >= 50) return 'text-orange-700'
  return 'text-red-700'
}

/** Returns the border/bg color class for confidence container */
export function getConfidenceBorderColor(percent: number): string {
  if (percent >= 80) return 'border-green-200 bg-green-50'
  if (percent >= 65) return 'border-yellow-200 bg-yellow-50'
  if (percent >= 50) return 'border-orange-200 bg-orange-50'
  return 'border-red-200 bg-red-50'
}
