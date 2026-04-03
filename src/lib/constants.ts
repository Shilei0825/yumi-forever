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
  // Northern NJ (primary service area)
  '07002', '07003', '07004', '07006', '07009', '07010', '07011', '07012',
  '07013', '07014', '07017', '07018', '07020', '07021', '07022', '07024',
  '07026', '07028', '07029', '07030', '07031', '07032', '07033', '07034',
  '07036', '07039', '07040', '07041', '07042', '07043', '07044', '07045',
  '07046', '07047', '07050', '07052', '07054', '07055', '07057', '07058',
  '07060', '07062', '07063', '07064', '07065', '07066', '07067', '07068',
  '07070', '07071', '07072', '07073', '07074', '07075', '07076', '07077',
  '07078', '07079', '07080', '07081', '07083', '07086', '07087', '07088',
  // Newark area
  '07101', '07102', '07103', '07104', '07105', '07106', '07107', '07108',
  '07109', '07110', '07111', '07112', '07114',
  // Jersey City / Hudson County
  '07302', '07304', '07305', '07306', '07307', '07310', '07311',
  // Hoboken / Weehawken
  '07030', '07086', '07087',
  // Bergen County
  '07601', '07603', '07604', '07605', '07606', '07607', '07608',
  '07621', '07624', '07626', '07627', '07628', '07630', '07631',
  '07632', '07640', '07641', '07642', '07643', '07644', '07645',
  '07646', '07647', '07648', '07649', '07650', '07652', '07656',
  '07657', '07660', '07661', '07662', '07663', '07666', '07670',
]

export const AUTO_SERVICES = [
  {
    name: 'Express Exterior',
    slug: 'express-exterior',
    serviceType: 'express_exterior' as const,
    description: 'Full hand wash, bug & tar removal, tire dressing, window cleaning, and spray wax finish.',
    basePrice: 14900,
    duration: 45,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 4500,
  },
  {
    name: 'Express Interior',
    slug: 'express-interior',
    serviceType: 'express_interior' as const,
    description: 'Full vacuum, dashboard & console wipe, door panels, interior glass, vent cleaning, and air freshener.',
    basePrice: 16900,
    duration: 60,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 5000,
  },
  {
    name: 'Express In & Out',
    slug: 'express-in-out',
    serviceType: 'express_in_out' as const,
    description: 'Complete express exterior wash plus full interior cleaning in one convenient visit.',
    basePrice: 26900,
    duration: 90,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 8000,
  },
  {
    name: 'Premium Exterior',
    slug: 'premium-exterior',
    serviceType: 'premium_exterior' as const,
    description: 'Express Exterior plus clay bar decontamination, one-step polish, synthetic sealant, and trim restoration.',
    basePrice: 24900,
    duration: 150,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 7500,
  },
  {
    name: 'Premium Interior',
    slug: 'premium-interior',
    serviceType: 'premium_interior' as const,
    description: 'Express Interior plus deep steam extraction, leather conditioning, stain treatment, and UV protectant.',
    basePrice: 27900,
    duration: 150,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 8500,
  },
  {
    name: 'Premium Detail',
    slug: 'premium-detail',
    serviceType: 'premium_detail' as const,
    description: 'Our finest service — complete premium exterior and interior detail with engine bay cleaning and paint correction consultation.',
    basePrice: 44900,
    duration: 300,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 13500,
    mostPopular: true,
  },
]

export const HOME_SERVICES = [
  {
    name: 'Standard Cleaning',
    slug: 'standard-cleaning',
    serviceType: 'standard' as const,
    description: 'Full home clean including kitchen, bathrooms, living areas, and bedrooms.',
    basePrice: 13000,
    duration: 120,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 5000,
  },
  {
    name: 'Deep Cleaning',
    slug: 'deep-cleaning',
    serviceType: 'deep' as const,
    description: 'Intensive deep clean with baseboards, inside cabinets, appliances, and more.',
    basePrice: 22000,
    duration: 210,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 7500,
  },
  {
    name: 'Move-In / Move-Out Cleaning',
    slug: 'move-in-move-out-cleaning',
    serviceType: 'move_in_out' as const,
    description: 'Top-to-bottom cleaning for moving transitions. Get your deposit back.',
    basePrice: 26000,
    duration: 300,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 9000,
  },
  {
    name: 'Carpet Cleaning',
    slug: 'carpet-cleaning',
    serviceType: 'carpet' as const,
    description: 'Professional hot water extraction with stain treatment and deodorizing.',
    basePrice: 10000,
    duration: 120,
    requiresQuote: false,
    requiresDeposit: true,
    depositAmount: 4000,
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
  { id: 'oven-cleaning', name: 'Oven Cleaning', description: 'Interior deep clean, degreasing, racks', price: 5500, unit: 'per oven' },
  { id: 'fridge-cleaning', name: 'Refrigerator Cleaning', description: 'Interior shelves, drawers, and seals', price: 5500, unit: 'per fridge' },
  { id: 'inside-cabinets', name: 'Inside Cabinets & Drawers', description: 'Wipe and organize kitchen/bath cabinets', price: 6500, unit: 'per kitchen or bath' },
  { id: 'carpet-deodorizing', name: 'Carpet Deodorizing', description: 'Deep deodorizer treatment for carpet odors', price: 4900, unit: 'per room' },
  { id: 'laundry-wash-fold', name: 'Laundry (Wash, Dry & Fold)', description: 'We wash, dry, and fold your laundry', price: 3500, unit: 'per load' },
  { id: 'bed-linen-change', name: 'Bed Linen Change & Laundry', description: 'Strip, wash, dry, and remake beds', price: 2900, unit: 'per bed' },
  { id: 'window-cleaning', name: 'Interior Window Cleaning', description: 'Glass, sills, and tracks', price: 1500, unit: 'per window' },
  { id: 'pet-hair-deep', name: 'Pet Hair Deep Clean', description: 'Extra attention to pet hair on furniture and carpets', price: 6500, unit: 'flat rate' },
  { id: 'dishwasher-cleaning', name: 'Dishwasher Cleaning', description: 'Interior deep clean and filter cleaning', price: 4500, unit: 'per unit' },
  { id: 'garage-cleaning', name: 'Garage Sweep & Mop', description: 'Floor sweeping, mopping, and cobweb removal', price: 7500, unit: 'flat rate' },
  { id: 'patio-balcony', name: 'Patio / Balcony Cleaning', description: 'Sweep, mop, and wipe railings', price: 5500, unit: 'flat rate' },
  { id: 'wall-spot-clean', name: 'Wall Spot Cleaning', description: 'Remove scuffs, marks, and fingerprints', price: 4500, unit: 'flat rate' },
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
      small:  { daily: 264000, '3x_week': 183000, weekly: 76000, bi_weekly: 43500, monthly: 27500, quarterly: 64000 },
      medium: { daily: 506000, '3x_week': 357000, weekly: 162000, bi_weekly: 93500, monthly: 55000, quarterly: 136000 },
      large:  { daily: 893000, '3x_week': 629000, weekly: 306000, bi_weekly: 174000, monthly: 102000, quarterly: 255000 },
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
  premier: 12,     // $0.12/sqft/visit
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
    category: 'individual' as const,
    description: '2 express washes + 1 interior detail per month',
    price: 19900,
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
    category: 'individual' as const,
    description: 'Bi-weekly standard home cleaning',
    price: 34900,
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
    category: 'individual' as const,
    description: 'Auto + home care at one unbeatable price',
    price: 47900,
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
// Travel / Distance Fees
// ---------------------------------------------------------------------------

export type TravelZone =
  | 'local'           // Northern NJ primary service area — no fee
  | 'nyc_manhattan'   // Manhattan — toll + congestion fee
  | 'nyc_outer'       // Brooklyn, Queens, Bronx, Staten Island — toll fee
  | 'extended'        // 30–50 miles from base — small travel fee
  | 'long_distance'   // 50+ miles — mileage-based fee

export interface TravelFeeResult {
  zone: TravelZone
  label: string
  fee: number         // cents
  breakdown: string
}

// Manhattan zip codes: 10001–10282
const MANHATTAN_PREFIX = ['100', '101', '102']
// Bronx: 104xx
const BRONX_PREFIX = ['104']
// Staten Island: 103xx
const STATEN_ISLAND_PREFIX = ['103']
// Brooklyn: 112xx
const BROOKLYN_PREFIX = ['112']
// Queens: 110xx, 111xx, 113xx, 114xx, 116xx
const QUEENS_PREFIX = ['110', '111', '113', '114', '116']

// Extended NJ zips (Central/South NJ, ~30-50 miles)
const EXTENDED_NJ_PREFIX = ['078', '079', '088', '089']

// Long distance indicators (PA, CT, upstate NY, far south NJ)
const LONG_DISTANCE_PREFIX = ['105', '106', '107', '108', '109', '125', '126', '127', '128', '129', '190', '191', '060', '061', '068', '069', '085', '086', '087']

export const TRAVEL_FEES: Record<Exclude<TravelZone, 'local'>, { fee: number; label: string; breakdown: string }> = {
  nyc_manhattan: {
    fee: 7500,    // $75 — covers GWB/Lincoln/Holland toll + congestion pricing
    label: 'Manhattan Travel & Toll Fee',
    breakdown: 'Bridge/tunnel toll + NYC congestion surcharge',
  },
  nyc_outer: {
    fee: 4500,    // $45 — covers bridge/tunnel toll
    label: 'NYC Borough Travel Fee',
    breakdown: 'Bridge/tunnel toll + travel surcharge',
  },
  extended: {
    fee: 3500,    // $35 — extended drive
    label: 'Extended Area Travel Fee',
    breakdown: 'Travel surcharge for locations 30–50 miles from service base',
  },
  long_distance: {
    fee: 7500,    // $75 base + calculated per mile
    label: 'Long Distance Travel Fee',
    breakdown: 'Travel surcharge for locations 50+ miles from service base',
  },
}

export function detectTravelZone(zipCode: string): TravelZone {
  const prefix = zipCode.slice(0, 3)

  if (MANHATTAN_PREFIX.includes(prefix)) return 'nyc_manhattan'
  if (BRONX_PREFIX.includes(prefix) || STATEN_ISLAND_PREFIX.includes(prefix) || BROOKLYN_PREFIX.includes(prefix) || QUEENS_PREFIX.includes(prefix)) return 'nyc_outer'
  if (LONG_DISTANCE_PREFIX.includes(prefix)) return 'long_distance'
  if (EXTENDED_NJ_PREFIX.includes(prefix)) return 'extended'

  return 'local'
}

export function calculateTravelFee(zipCode: string): TravelFeeResult {
  const zone = detectTravelZone(zipCode)

  if (zone === 'local') {
    return { zone, label: 'Local Service Area', fee: 0, breakdown: 'No travel fee' }
  }

  const config = TRAVEL_FEES[zone]
  return {
    zone,
    label: config.label,
    fee: config.fee,
    breakdown: config.breakdown,
  }
}

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

export interface AddonDefinition {
  id: string
  name: string
  description?: string
  pricing: Record<VehicleType, number>
  quoteOnly?: boolean
  /** Service slugs where this add-on is already included */
  includedIn?: string[]
  /** If true, user can specify quantity (e.g. number of spots for paint correction) */
  quantifiable?: boolean
  quantityLabel?: string
}

export const ADDONS: AddonDefinition[] = [
  { id: 'engine-bay', name: 'Engine Bay Cleaning', description: 'Detailed engine compartment cleaning and degreasing', pricing: { sedan: 8900, compact_suv: 10900, large_suv: 13900 }, includedIn: ['premium-detail'] },
  { id: 'odor-removal', name: 'Odor Removal', description: 'Professional ozone treatment and deodorizing', pricing: { sedan: 10900, compact_suv: 13900, large_suv: 17900 } },
  { id: 'clay-bar', name: 'Clay Bar Treatment', description: 'Paint decontamination for a smooth finish', pricing: { sedan: 7900, compact_suv: 9900, large_suv: 12900 }, includedIn: ['premium-exterior', 'premium-detail'] },
  { id: 'hand-wax', name: 'Hand Wax & Seal', description: 'Premium hand wax with protective sealant', pricing: { sedan: 8900, compact_suv: 11900, large_suv: 14900 } },
  { id: 'headlight-restoration', name: 'Headlight Restoration', description: 'UV-damaged lens sanding, polishing, and clear coat seal', pricing: { sedan: 11900, compact_suv: 11900, large_suv: 11900 } },
  { id: 'paint-correction', name: 'Paint Correction', description: 'Scratch & swirl removal per panel (hood, door, fender, etc.)', pricing: { sedan: 10900, compact_suv: 10900, large_suv: 10900 }, quantifiable: true, quantityLabel: 'panels' },
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
    pricing: { sedan: 14900, compact_suv: 18900, large_suv: 22900 },
    depositAmount: 4500,
  },
  {
    slug: 'express-interior',
    name: 'Express Interior',
    description: 'Full vacuum, dashboard & console wipe, door panels, interior glass, vent cleaning, and air freshener.',
    duration: 60,
    tier: 'express',
    includes: ['Full vacuum', 'Dashboard & console wipe', 'Door panel cleaning', 'Interior glass', 'Vent cleaning', 'Air freshener'],
    pricing: { sedan: 16900, compact_suv: 20900, large_suv: 25900 },
    depositAmount: 5000,
  },
  {
    slug: 'express-in-out',
    name: 'Express In & Out',
    description: 'Complete express exterior wash plus full interior cleaning in one convenient visit.',
    duration: 90,
    tier: 'express',
    includes: ['Everything in Express Exterior', 'Everything in Express Interior'],
    pricing: { sedan: 26900, compact_suv: 33900, large_suv: 41900 },
    depositAmount: 8000,
  },
  {
    slug: 'premium-exterior',
    name: 'Premium Exterior',
    description: 'Express Exterior plus clay bar decontamination, one-step polish, synthetic sealant, and trim restoration.',
    duration: 150,
    tier: 'premium',
    includes: ['Everything in Express Exterior', 'Clay bar decontamination', 'One-step polish', 'Synthetic sealant', 'Trim restoration', 'Exhaust tip polish'],
    pricing: { sedan: 24900, compact_suv: 31900, large_suv: 39900 },
    depositAmount: 7500,
  },
  {
    slug: 'premium-interior',
    name: 'Premium Interior',
    description: 'Express Interior plus deep steam extraction, leather conditioning, stain treatment, and UV protectant.',
    duration: 150,
    tier: 'premium',
    includes: ['Everything in Express Interior', 'Steam / hot water extraction', 'Leather cleaning & conditioning', 'Stain treatment', 'UV protectant on plastics'],
    pricing: { sedan: 27900, compact_suv: 34900, large_suv: 44900 },
    depositAmount: 8500,
  },
  {
    slug: 'premium-detail',
    name: 'Premium Detail',
    description: 'Our finest service — complete premium exterior and interior detail with engine bay cleaning and paint correction consultation.',
    duration: 300,
    tier: 'premium',
    popular: true,
    includes: ['Everything in Premium Exterior', 'Everything in Premium Interior', 'Engine bay cleaning', 'Paint correction consultation', 'Final LED inspection'],
    pricing: { sedan: 44900, compact_suv: 56900, large_suv: 69900 },
    depositAmount: 13500,
  },
]
