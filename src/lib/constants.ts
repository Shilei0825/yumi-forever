export const BRAND = {
  name: 'Yumi Forever',
  tagline: 'Care Revolves Around You',
  description:
    'Professional home cleaning, car detailing, and fleet services delivered to your door.',
  phone: '(555) 123-4567',
  email: 'support@yumiforever.com',
  address: 'Serving the NYC & NJ Area',
}

export const SERVICE_AREAS = [
  '90001', '90002', '90003', '90004', '90005',
  '90006', '90007', '90008', '90009', '90010',
  '90011', '90012', '90013', '90014', '90015',
  '90016', '90017', '90018', '90019', '90020',
  '90024', '90025', '90028', '90034', '90035',
  '90036', '90038', '90039', '90041', '90042',
  '90043', '90044', '90045', '90046', '90047',
  '90048', '90049', '90056', '90057', '90058',
  '90059', '90061', '90062', '90063', '90064',
  '90065', '90066', '90067', '90068', '90069',
  '90071', '90077', '90094', '90210', '90211',
  '90212', '90230', '90232', '90245', '90247',
  '90248', '90249', '90250', '90254', '90260',
  '90266', '90270', '90274', '90275', '90277',
  '90278', '90290', '90291', '90292', '90293',
  '90301', '90302', '90303', '90304', '90305',
]

export const AUTO_SERVICES = [
  {
    name: 'Express Exterior',
    slug: 'express-exterior',
    serviceType: 'express_exterior' as const,
    description: 'Full hand wash, bug & tar removal, tire dressing, window cleaning, and spray wax finish.',
    basePrice: 8500,
    duration: 45,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 2500,
  },
  {
    name: 'Express Interior',
    slug: 'express-interior',
    serviceType: 'express_interior' as const,
    description: 'Full vacuum, dashboard & console wipe, door panels, interior glass, vent cleaning, and air freshener.',
    basePrice: 9500,
    duration: 60,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 2500,
  },
  {
    name: 'Express In & Out',
    slug: 'express-in-out',
    serviceType: 'express_in_out' as const,
    description: 'Complete express exterior wash plus full interior cleaning in one convenient visit.',
    basePrice: 14000,
    duration: 90,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 4000,
  },
  {
    name: 'Premium Exterior',
    slug: 'premium-exterior',
    serviceType: 'premium_exterior' as const,
    description: 'Express Exterior plus clay bar decontamination, one-step polish, synthetic sealant, and trim restoration.',
    basePrice: 18000,
    duration: 150,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 5000,
  },
  {
    name: 'Premium Interior',
    slug: 'premium-interior',
    serviceType: 'premium_interior' as const,
    description: 'Express Interior plus deep steam extraction, leather conditioning, stain treatment, and UV protectant.',
    basePrice: 22500,
    duration: 150,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 6000,
  },
  {
    name: 'Premium Detail',
    slug: 'premium-detail',
    serviceType: 'premium_detail' as const,
    description: 'Our finest service — complete premium exterior and interior detail with engine bay cleaning and paint correction consultation.',
    basePrice: 32500,
    duration: 300,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 8000,
    mostPopular: true,
  },
]

export const HOME_SERVICES = [
  {
    name: 'Standard Cleaning',
    slug: 'standard-cleaning',
    serviceType: 'standard' as const,
    description: 'Full home clean including kitchen, bathrooms, living areas, and bedrooms.',
    basePrice: 15000,
    duration: 90,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 4000,
  },
  {
    name: 'Deep Cleaning',
    slug: 'deep-cleaning',
    serviceType: 'deep' as const,
    description: 'Intensive deep clean with baseboards, inside cabinets, appliances, and more.',
    basePrice: 25000,
    duration: 180,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 6000,
  },
  {
    name: 'Move-In / Move-Out Cleaning',
    slug: 'move-in-move-out-cleaning',
    serviceType: 'move_in_out' as const,
    description: 'Top-to-bottom cleaning for moving transitions. Get your deposit back.',
    basePrice: 30000,
    duration: 240,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 7500,
  },
  {
    name: 'Carpet Cleaning',
    slug: 'carpet-cleaning',
    serviceType: 'carpet' as const,
    description: 'Professional hot water extraction with stain treatment and deodorizing.',
    basePrice: 12000,
    duration: 90,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 3000,
  },
]

// Home Cleaning Add-Ons (prices in cents, NYC/NJ market rates)
export const HOME_ADDONS: {
  id: string
  name: string
  description: string
  price: number
  unit: string
}[] = [
  { id: 'oven-cleaning', name: 'Oven Cleaning', description: 'Interior deep clean, degreasing, racks', price: 4000, unit: 'per oven' },
  { id: 'fridge-cleaning', name: 'Refrigerator Cleaning', description: 'Interior shelves, drawers, and seals', price: 4000, unit: 'per fridge' },
  { id: 'inside-cabinets', name: 'Inside Cabinets & Drawers', description: 'Wipe and organize kitchen/bath cabinets', price: 4500, unit: 'per kitchen or bath' },
  { id: 'carpet-deodorizing', name: 'Carpet Deodorizing', description: 'Deep deodorizer treatment for carpet odors', price: 3500, unit: 'per room' },
  { id: 'laundry-wash-fold', name: 'Laundry (Wash, Dry & Fold)', description: 'We wash, dry, and fold your laundry', price: 2500, unit: 'per load' },
  { id: 'bed-linen-change', name: 'Bed Linen Change & Laundry', description: 'Strip, wash, dry, and remake beds', price: 2000, unit: 'per bed' },
  { id: 'window-cleaning', name: 'Interior Window Cleaning', description: 'Glass, sills, and tracks', price: 1000, unit: 'per window' },
  { id: 'pet-hair-deep', name: 'Pet Hair Deep Clean', description: 'Extra attention to pet hair on furniture and carpets', price: 4500, unit: 'flat rate' },
  { id: 'dishwasher-cleaning', name: 'Dishwasher Cleaning', description: 'Interior deep clean and filter cleaning', price: 3000, unit: 'per unit' },
  { id: 'garage-cleaning', name: 'Garage Sweep & Mop', description: 'Floor sweeping, mopping, and cobweb removal', price: 5000, unit: 'flat rate' },
  { id: 'patio-balcony', name: 'Patio / Balcony Cleaning', description: 'Sweep, mop, and wipe railings', price: 4000, unit: 'flat rate' },
  { id: 'wall-spot-clean', name: 'Wall Spot Cleaning', description: 'Remove scuffs, marks, and fingerprints', price: 3000, unit: 'flat rate' },
]

export const FLEET_SERVICES = [
  {
    name: 'Fleet Wash',
    slug: 'fleet-wash',
    description: 'Exterior wash for fleet vehicles at your location.',
    basePrice: 0,
    duration: 0,
    requiresQuote: true,
    requiresDeposit: false,
  },
  {
    name: 'Fleet Detailing',
    slug: 'fleet-detailing',
    description: 'Full detail service for fleet vehicles.',
    basePrice: 0,
    duration: 0,
    requiresQuote: true,
    requiresDeposit: false,
  },
  {
    name: 'Commercial Contract',
    slug: 'commercial-contract',
    description: 'Recurring service contracts for businesses.',
    basePrice: 0,
    duration: 0,
    requiresQuote: true,
    requiresDeposit: false,
  },
]

// ---------------------------------------------------------------------------
// Office & Commercial Cleaning
// ---------------------------------------------------------------------------

export type OfficeSize = 'small' | 'medium' | 'large'

export type CleaningFrequency = 'daily' | '3x_week' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly'

export const OFFICE_SIZES: { key: OfficeSize; label: string; description: string; sqft: string }[] = [
  { key: 'small', label: 'Small Office', description: 'Up to 2,000 sq ft', sqft: '< 2,000 sq ft' },
  { key: 'medium', label: 'Medium Office', description: '2,000 – 5,000 sq ft', sqft: '2,000 – 5,000 sq ft' },
  { key: 'large', label: 'Large Office', description: '5,000 – 10,000 sq ft', sqft: '5,000 – 10,000 sq ft' },
]

export const CLEANING_FREQUENCIES: { key: CleaningFrequency; label: string; description: string; visitsPerMonth: number }[] = [
  { key: 'daily', label: 'Daily (5x/week)', description: 'Monday through Friday', visitsPerMonth: 22 },
  { key: '3x_week', label: '3x per Week', description: 'Three visits per week', visitsPerMonth: 13 },
  { key: 'weekly', label: 'Weekly', description: 'Once per week', visitsPerMonth: 4 },
  { key: 'bi_weekly', label: 'Bi-Weekly', description: 'Every two weeks', visitsPerMonth: 2 },
  { key: 'monthly', label: 'Monthly', description: 'Once per month', visitsPerMonth: 1 },
  { key: 'quarterly', label: 'Quarterly (Deep Clean)', description: 'Every three months', visitsPerMonth: 0.33 },
]

export interface OfficePlan {
  slug: string
  name: string
  tier: 'essential' | 'professional' | 'premier'
  description: string
  features: string[]
  popular?: boolean
  pricing: Record<OfficeSize, Record<CleaningFrequency, number>> // monthly price in cents
}

export const OFFICE_PLANS: OfficePlan[] = [
  {
    slug: 'yumi-essential',
    name: 'Yumi Essential',
    tier: 'essential',
    description: 'Standard office cleaning for everyday maintenance.',
    features: [
      'Trash & recycling removal',
      'Full vacuuming & mopping',
      'Surface dusting',
      'High-touch disinfection',
      'Restroom cleaning & restocking',
      'Break room counter wipe-down',
      'Spot clean glass doors',
    ],
    pricing: {
      small:  { daily: 198000, '3x_week': 135000, weekly: 55000, bi_weekly: 32000, monthly: 19500, quarterly: 40000 },
      medium: { daily: 385000, '3x_week': 265000, weekly: 120000, bi_weekly: 68000, monthly: 40000, quarterly: 75000 },
      large:  { daily: 680000, '3x_week': 470000, weekly: 230000, bi_weekly: 130000, monthly: 75000, quarterly: 140000 },
    },
  },
  {
    slug: 'yumi-professional',
    name: 'Yumi Professional',
    tier: 'professional',
    description: 'Enhanced cleaning with dedicated team and extras.',
    popular: true,
    features: [
      'Everything in Essential',
      'Weekly detail dusting (blinds, sills, ledges)',
      'Baseboard & cabinet wipe-down',
      'Break room appliance cleaning',
      'Reception & lobby detail',
      'Monthly high dusting (vents, fixtures)',
      'Quarterly interior window cleaning',
      'Dedicated cleaning team',
    ],
    pricing: {
      small:  { daily: 245000, '3x_week': 168000, weekly: 69500, bi_weekly: 39500, monthly: 24500, quarterly: 55000 },
      medium: { daily: 475000, '3x_week': 330000, weekly: 150000, bi_weekly: 85000, monthly: 50000, quarterly: 120000 },
      large:  { daily: 840000, '3x_week': 585000, weekly: 285000, bi_weekly: 160000, monthly: 95000, quarterly: 220000 },
    },
  },
  {
    slug: 'yumi-premier',
    name: 'Yumi Premier',
    tier: 'premier',
    description: 'Full-service premium cleaning with all extras included.',
    features: [
      'Everything in Professional',
      'Daily surface disinfection',
      'Monthly carpet spot treatment',
      'Monthly floor buffing',
      'Quarterly deep carpet extraction',
      'Monthly interior window cleaning',
      'Semi-annual exterior window cleaning',
      'Annual upholstery cleaning',
      'Dedicated account manager',
      'Monthly facility reports',
    ],
    pricing: {
      small:  { daily: 310000, '3x_week': 215000, weekly: 89500, bi_weekly: 51000, monthly: 32000, quarterly: 75000 },
      medium: { daily: 595000, '3x_week': 420000, weekly: 190000, bi_weekly: 110000, monthly: 65000, quarterly: 160000 },
      large:  { daily: 1050000, '3x_week': 740000, weekly: 360000, bi_weekly: 205000, monthly: 120000, quarterly: 300000 },
    },
  },
]

// ---------------------------------------------------------------------------
// Business / Industry Types (affects commercial cleaning pricing)
// ---------------------------------------------------------------------------

export type BusinessType =
  | 'office'
  | 'coworking'
  | 'restaurant'
  | 'cafe'
  | 'gym'
  | 'medical'
  | 'dental'
  | 'retail'
  | 'salon'
  | 'warehouse'
  | 'school'
  | 'daycare'

export const BUSINESS_TYPES: {
  key: BusinessType
  label: string
  description: string
  multiplier: number
  extraNotes: string[]
}[] = [
  {
    key: 'office',
    label: 'Office',
    description: 'Standard office or corporate environment',
    multiplier: 1.0,
    extraNotes: [],
  },
  {
    key: 'coworking',
    label: 'Coworking Space',
    description: 'Shared workspace with high-traffic common areas',
    multiplier: 1.1,
    extraNotes: ['High-traffic common area disinfection', 'Phone booth / pod cleaning'],
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    description: 'Dining area, commercial kitchen, restrooms',
    multiplier: 1.45,
    extraNotes: ['Kitchen deep cleaning & degreasing', 'Health code compliance cleaning', 'Hood & grease trap area'],
  },
  {
    key: 'cafe',
    label: 'Café / Bakery',
    description: 'Counter service with small food prep area',
    multiplier: 1.25,
    extraNotes: ['Counter & display case cleaning', 'Food prep area sanitization'],
  },
  {
    key: 'gym',
    label: 'Gym / Fitness Center',
    description: 'Equipment floor, locker rooms, showers',
    multiplier: 1.35,
    extraNotes: ['Equipment sanitization', 'Locker room & shower deep clean', 'Rubber floor maintenance'],
  },
  {
    key: 'medical',
    label: 'Medical Office',
    description: 'Exam rooms, waiting area, strict sanitation',
    multiplier: 1.55,
    extraNotes: ['Medical-grade disinfection', 'Biohazard-aware protocols', 'OSHA-compliant procedures'],
  },
  {
    key: 'dental',
    label: 'Dental Office',
    description: 'Treatment rooms, sterilization area, waiting room',
    multiplier: 1.45,
    extraNotes: ['Treatment room disinfection', 'Sterilization area cleaning', 'Dental dust management'],
  },
  {
    key: 'retail',
    label: 'Retail Store',
    description: 'Sales floor, fitting rooms, stockroom',
    multiplier: 0.9,
    extraNotes: ['Display & shelf dusting', 'Fitting room sanitization'],
  },
  {
    key: 'salon',
    label: 'Salon / Spa',
    description: 'Treatment rooms, styling stations, reception',
    multiplier: 1.2,
    extraNotes: ['Station sanitization', 'Treatment room deep clean'],
  },
  {
    key: 'warehouse',
    label: 'Warehouse / Industrial',
    description: 'Large open floor space with office section',
    multiplier: 0.7,
    extraNotes: ['Industrial floor scrubbing', 'Dock area cleaning'],
  },
  {
    key: 'school',
    label: 'School / Education',
    description: 'Classrooms, hallways, cafeteria, admin offices',
    multiplier: 1.3,
    extraNotes: ['Child-safe cleaning products', 'Cafeteria deep cleaning'],
  },
  {
    key: 'daycare',
    label: 'Daycare / Childcare',
    description: 'Play areas, nap rooms, kitchen, bathrooms',
    multiplier: 1.4,
    extraNotes: ['Non-toxic, child-safe products only', 'Toy & surface sanitization', 'Nap area deep clean'],
  },
]

// ---------------------------------------------------------------------------
// Commercial Pricing Engine
// ---------------------------------------------------------------------------
// Base per-sqft per-visit rate (in cents) by plan tier
const COMMERCIAL_BASE_RATE: Record<'essential' | 'professional' | 'premier', number> = {
  essential: 9,    // $0.09/sqft/visit
  professional: 11, // $0.11/sqft/visit
  premier: 14,     // $0.14/sqft/visit
}

// Frequency discount — more visits = lower per-visit rate
const FREQUENCY_DISCOUNT: Record<CleaningFrequency, number> = {
  daily: 0.65,
  '3x_week': 0.75,
  weekly: 0.90,
  bi_weekly: 1.0,
  monthly: 1.0,
  quarterly: 1.3,
}

// Visits per month lookup
const VISITS_PER_MONTH: Record<CleaningFrequency, number> = {
  daily: 22,
  '3x_week': 13,
  weekly: 4,
  bi_weekly: 2,
  monthly: 1,
  quarterly: 0.33,
}

// Minimum monthly rates (cents) per tier
const MIN_MONTHLY: Record<'essential' | 'professional' | 'premier', number> = {
  essential: 15000,
  professional: 20000,
  premier: 28000,
}

export interface CommercialQuote {
  perVisitRate: number   // cents
  monthlyRate: number    // cents
  monthlyTax: number     // cents
  monthlyTotal: number   // cents
  annualEstimate: number // cents
  sqft: number
  businessType: BusinessType
  planTier: 'essential' | 'professional' | 'premier'
  frequency: CleaningFrequency
  industryMultiplier: number
  contractDiscount: number
  restroomSurcharge: number
  lineItems: { label: string; amount: number }[]
}

export function calculateCommercialQuote(opts: {
  sqft: number
  planTier: 'essential' | 'professional' | 'premier'
  frequency: CleaningFrequency
  businessType: BusinessType
  restrooms: number
  contractMonths: number
}): CommercialQuote {
  const { sqft, planTier, frequency, businessType, restrooms, contractMonths } = opts

  const industryMultiplier = BUSINESS_TYPES.find((b) => b.key === businessType)?.multiplier ?? 1.0
  const contractDisc = CONTRACT_DISCOUNTS.find((cd) => cd.months === contractMonths)?.discount ?? 0
  const visitsPerMonth = VISITS_PER_MONTH[frequency]
  const freqDiscount = FREQUENCY_DISCOUNT[frequency]

  // Volume discount for larger spaces
  let volumeDiscount = 1.0
  if (sqft > 5000) volumeDiscount = 0.92
  else if (sqft > 3000) volumeDiscount = 0.96

  // Base per-visit rate
  const baseRate = COMMERCIAL_BASE_RATE[planTier]
  const perVisitRate = Math.round(baseRate * sqft * freqDiscount * volumeDiscount * industryMultiplier)

  // Restroom surcharge: $15/restroom/visit (adds up)
  const restroomPerVisit = restrooms * 1500
  const restroomSurcharge = Math.round(restroomPerVisit * visitsPerMonth)

  // Monthly before contract discount
  const rawMonthly = Math.round(perVisitRate * visitsPerMonth) + restroomSurcharge

  // Apply minimum
  const minAdjusted = Math.max(rawMonthly, MIN_MONTHLY[planTier])

  // Apply contract discount
  const monthlyRate = Math.round(minAdjusted * (1 - contractDisc))
  const monthlyTax = Math.round(monthlyRate * TAX_RATE)
  const monthlyTotal = monthlyRate + monthlyTax

  // Build line items
  const lineItems: { label: string; amount: number }[] = [
    { label: `Base cleaning (${sqft.toLocaleString()} sqft)`, amount: Math.round(perVisitRate * visitsPerMonth) },
  ]
  if (restroomSurcharge > 0) {
    lineItems.push({ label: `Restroom service (${restrooms} restroom${restrooms > 1 ? 's' : ''})`, amount: restroomSurcharge })
  }
  if (industryMultiplier !== 1.0) {
    const label = industryMultiplier > 1 ? 'Industry-specific requirements' : 'Simplified scope discount'
    lineItems.push({ label, amount: 0 })
  }
  if (contractDisc > 0) {
    lineItems.push({ label: `Contract discount (${Math.round(contractDisc * 100)}%)`, amount: -(minAdjusted - monthlyRate) })
  }

  return {
    perVisitRate,
    monthlyRate,
    monthlyTax,
    monthlyTotal,
    annualEstimate: monthlyTotal * 12,
    sqft,
    businessType,
    planTier,
    frequency,
    industryMultiplier,
    contractDiscount: contractDisc,
    restroomSurcharge,
    lineItems,
  }
}

// Extended office sizes for sqft-based quoting
export const OFFICE_SQFT_RANGES: { key: string; label: string; sqft: number; description: string }[] = [
  { key: 'micro', label: 'Micro', sqft: 800, description: 'Under 1,000 sq ft' },
  { key: 'small', label: 'Small', sqft: 1500, description: '1,000 – 2,000 sq ft' },
  { key: 'medium', label: 'Medium', sqft: 3500, description: '2,000 – 5,000 sq ft' },
  { key: 'large', label: 'Large', sqft: 7500, description: '5,000 – 10,000 sq ft' },
  { key: 'xlarge', label: 'Extra Large', sqft: 15000, description: '10,000 – 20,000 sq ft' },
  { key: 'custom', label: 'Custom', sqft: 0, description: 'Enter exact square footage' },
]

export const OFFICE_ADDONS = [
  { id: 'carpet-extraction', name: 'Deep Carpet Extraction', pricePerSqFt: 20 },
  { id: 'floor-strip-wax', name: 'Floor Stripping & Waxing', pricePerSqFt: 50 },
  { id: 'floor-buffing', name: 'Floor Buffing / Burnishing', pricePerSqFt: 15 },
  { id: 'window-interior', name: 'Interior Window Cleaning', pricePerPane: 800 },
  { id: 'window-exterior', name: 'Exterior Window Cleaning', pricePerWindow: 600 },
  { id: 'electrostatic', name: 'Electrostatic Disinfection', pricePerSqFt: 15 },
  { id: 'upholstery', name: 'Upholstery / Chair Cleaning', pricePerPiece: 7500 },
  { id: 'pressure-wash', name: 'Pressure Washing', pricePerSqFt: 25 },
  { id: 'day-porter', name: 'Day Porter Service (Full Day)', pricePerDay: 25000 },
]

export const CONTRACT_DISCOUNTS: { months: number; label: string; discount: number }[] = [
  { months: 1, label: 'Month-to-Month', discount: 0 },
  { months: 6, label: '6-Month Agreement', discount: 0.05 },
  { months: 12, label: '12-Month Agreement', discount: 0.10 },
  { months: 24, label: '24-Month Agreement', discount: 0.15 },
]

export const MEMBERSHIP_PLANS = [
  {
    name: 'Auto Care Monthly',
    slug: 'auto-care-monthly',
    description: '2 express washes + 1 interior detail per month',
    price: 9900,
    interval: 'month' as const,
    features: [
      '2 express exterior hand washes',
      '1 express interior detail',
      '15% off premium services & add-ons',
      'Priority scheduling',
      'Cancel anytime',
    ],
  },
  {
    name: 'Home Care Monthly',
    slug: 'home-care-monthly',
    description: 'Bi-weekly standard home cleaning',
    price: 19900,
    interval: 'month' as const,
    features: [
      '2 standard home cleanings per month',
      '20% off deep cleaning & move-in/out',
      'Same crew every visit',
      'Priority scheduling',
      'Cancel anytime',
    ],
  },
  {
    name: 'Premium Bundle',
    slug: 'premium-bundle',
    description: 'Auto + home care at one unbeatable price',
    price: 27900,
    interval: 'month' as const,
    popular: true,
    features: [
      '2 standard home cleanings per month',
      '2 express exterior washes per month',
      '1 express interior detail per month',
      '25% off all premium & add-on services',
      'Priority scheduling & dedicated crew',
      'Cancel anytime',
    ],
  },
]

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00',
]

export const TAX_RATE = 0.0875 // 8.75%

// ---------------------------------------------------------------------------
// Auto Booking — Vehicle-Based Pricing
// ---------------------------------------------------------------------------

export type VehicleType = 'sedan' | 'compact_suv' | 'large_suv'

export type ServiceTier = 'express' | 'premium'

export interface ServiceDefinition {
  slug: string
  name: string
  description: string
  duration: number
  tier: ServiceTier
  popular?: boolean
  includes?: string[]
  pricing: Record<VehicleType, number>
  depositAmount: number
}

export const VEHICLE_TYPES: { key: VehicleType; label: string; description: string }[] = [
  { key: 'sedan', label: 'Sedan / Coupe', description: 'Cars, coupes, and compact vehicles' },
  { key: 'compact_suv', label: 'SUV / Crossover', description: 'Mid-size SUVs, crossovers, and minivans' },
  { key: 'large_suv', label: '3-Row SUV / Pickup', description: 'Full-size SUVs, trucks, and vans' },
]

export const ADDONS: { id: string; name: string; description?: string; pricing: Record<VehicleType, number>; quoteOnly?: boolean }[] = [
  { id: 'engine-bay', name: 'Engine Bay Cleaning', description: 'Detailed engine compartment cleaning and degreasing', pricing: { sedan: 6000, compact_suv: 7500, large_suv: 9500 } },
  { id: 'odor-removal', name: 'Odor Removal', description: 'Professional ozone treatment and deodorizing', pricing: { sedan: 7500, compact_suv: 9500, large_suv: 12500 } },
  { id: 'clay-bar', name: 'Clay Bar Treatment', description: 'Paint decontamination for a smooth finish', pricing: { sedan: 5000, compact_suv: 6500, large_suv: 8500 } },
  { id: 'hand-wax', name: 'Hand Wax & Seal', description: 'Premium hand wax with protective sealant', pricing: { sedan: 6000, compact_suv: 8000, large_suv: 10000 } },
  { id: 'ceramic-coating', name: 'Ceramic Coating', description: 'Professional-grade ceramic paint protection', pricing: { sedan: 0, compact_suv: 0, large_suv: 0 }, quoteOnly: true },
  { id: 'window-tint', name: 'Window Tint', description: 'Professional window tinting service', pricing: { sedan: 0, compact_suv: 0, large_suv: 0 }, quoteOnly: true },
  { id: 'ppf', name: 'PPF (Paint Protection Film)', description: 'Clear film protection for high-impact areas', pricing: { sedan: 0, compact_suv: 0, large_suv: 0 }, quoteOnly: true },
]

export const SERVICES: ServiceDefinition[] = [
  {
    slug: 'express-exterior',
    name: 'Express Exterior',
    description: 'Full hand wash, bug & tar removal, tire dressing, window cleaning, and spray wax finish.',
    duration: 45,
    tier: 'express',
    includes: ['Hand wash', 'Bug & tar removal', 'Tire dressing', 'Window cleaning', 'Spray wax finish'],
    pricing: { sedan: 8500, compact_suv: 11000, large_suv: 13500 },
    depositAmount: 2500,
  },
  {
    slug: 'express-interior',
    name: 'Express Interior',
    description: 'Full vacuum, dashboard & console wipe, door panels, interior glass, vent cleaning, and air freshener.',
    duration: 60,
    tier: 'express',
    includes: ['Full vacuum', 'Dashboard & console wipe', 'Door panel cleaning', 'Interior glass', 'Vent cleaning', 'Air freshener'],
    pricing: { sedan: 9500, compact_suv: 12000, large_suv: 15000 },
    depositAmount: 2500,
  },
  {
    slug: 'express-in-out',
    name: 'Express In & Out',
    description: 'Complete express exterior wash plus full interior cleaning in one convenient visit.',
    duration: 90,
    tier: 'express',
    includes: ['Everything in Express Exterior', 'Everything in Express Interior'],
    pricing: { sedan: 14000, compact_suv: 18000, large_suv: 22000 },
    depositAmount: 4000,
  },
  {
    slug: 'premium-exterior',
    name: 'Premium Exterior',
    description: 'Express Exterior plus clay bar decontamination, one-step polish, synthetic sealant, and trim restoration.',
    duration: 150,
    tier: 'premium',
    includes: ['Everything in Express Exterior', 'Clay bar decontamination', 'One-step polish', 'Synthetic sealant', 'Trim restoration', 'Exhaust tip polish'],
    pricing: { sedan: 18000, compact_suv: 23000, large_suv: 29000 },
    depositAmount: 5000,
  },
  {
    slug: 'premium-interior',
    name: 'Premium Interior',
    description: 'Express Interior plus deep steam extraction, leather conditioning, stain treatment, and UV protectant.',
    duration: 150,
    tier: 'premium',
    includes: ['Everything in Express Interior', 'Steam / hot water extraction', 'Leather cleaning & conditioning', 'Stain treatment', 'UV protectant on plastics'],
    pricing: { sedan: 22500, compact_suv: 29000, large_suv: 35000 },
    depositAmount: 6000,
  },
  {
    slug: 'premium-detail',
    name: 'Premium Detail',
    description: 'Our finest service — complete premium exterior and interior detail with engine bay cleaning and paint correction consultation.',
    duration: 300,
    tier: 'premium',
    popular: true,
    includes: ['Everything in Premium Exterior', 'Everything in Premium Interior', 'Engine bay cleaning', 'Paint correction consultation', 'Final LED inspection'],
    pricing: { sedan: 32500, compact_suv: 40000, large_suv: 49000 },
    depositAmount: 8000,
  },
]
