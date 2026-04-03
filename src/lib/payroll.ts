// ---------------------------------------------------------------------------
// Payroll Calculation System — Yumi Forever
// All monetary values in CENTS.
//
// daily_pay = max(adjusted_base, total_commission) + review_bonus
//
// Base pay rules:
//   ≥3 jobs/day  → full base
//   1–2 jobs/day → 50% base
//   0 jobs (showed up, cancellations) → show-up guarantee ($60 lead, $50 helper)
//
// Commission:
//   Lead:   25% of final_price
//   Helper: 17% of final_price (20% if job total ≥ $300)
//
// Review bonus:
//   5-star review → +$5 per job
//   5+ five-star reviews in a week → +$50 weekly bonus
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrewRole = 'lead' | 'helper'

export interface CrewPayConfig {
  role: CrewRole
  baseDailyPay: number  // cents
  commissionRate: number // 0.25 = 25%
}

export interface CompletedJob {
  bookingId: string
  finalPrice: number    // cents — revenue from this job
  hasReview: boolean
  reviewRating: number  // 1-5
}

export interface DailyPayResult {
  crewMemberId: string
  role: CrewRole
  date: string
  jobCount: number
  adjustedBase: number      // cents
  totalCommission: number   // cents
  reviewBonus: number       // cents
  dailyPay: number          // cents
  breakdown: {
    fullBase: number
    baseMultiplier: number
    jobs: {
      bookingId: string
      commission: number
      reviewBonus: number
    }[]
  }
}

export interface WeeklyPaySummary {
  crewMemberId: string
  role: CrewRole
  weekStart: string
  weekEnd: string
  totalDailyPay: number     // cents — sum of daily pays
  weeklyReviewBonus: number // cents — bonus for 10+ 5-star reviews
  totalPay: number          // cents — total with weekly bonus
  totalJobs: number
  totalRevenue: number      // cents — sum of final prices
  fiveStarCount: number
  dailyBreakdowns: DailyPayResult[]
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const CREW_PAY_CONFIG: Record<CrewRole, CrewPayConfig> = {
  lead: {
    role: 'lead',
    baseDailyPay: 10000,    // $100/day
    commissionRate: 0.25,    // 25%
  },
  helper: {
    role: 'helper',
    baseDailyPay: 8000,     // $80/day
    commissionRate: 0.17,    // 17% (upgrades to 20% for jobs ≥$300)
  },
}

const HELPER_HIGH_COMMISSION_THRESHOLD = 30000 // $300 in cents
const HELPER_HIGH_COMMISSION_RATE = 0.20       // 20%

// Show-up guarantee — crew member showed up but all jobs cancelled
const SHOW_UP_GUARANTEE: Record<CrewRole, number> = {
  lead: 6000,   // $60
  helper: 5000, // $50
}

const FIVE_STAR_BONUS_PER_JOB = 500            // $5
const WEEKLY_REVIEW_BONUS_THRESHOLD = 5        // 5+ five-star reviews in a week
const WEEKLY_REVIEW_BONUS = 5000               // $50

// ---------------------------------------------------------------------------
// Daily Pay Calculation
// ---------------------------------------------------------------------------

export function calculateDailyPay(
  crewMemberId: string,
  role: CrewRole,
  date: string,
  jobs: CompletedJob[],
): DailyPayResult {
  const config = CREW_PAY_CONFIG[role]
  const jobCount = jobs.length

  // Base pay adjustment
  let baseMultiplier = 0
  if (jobCount >= 3) baseMultiplier = 1.0
  else if (jobCount >= 1) baseMultiplier = 0.5
  // 0 jobs = show-up guarantee (crew showed up but jobs cancelled)

  const adjustedBase = jobCount === 0
    ? SHOW_UP_GUARANTEE[role]
    : Math.round(config.baseDailyPay * baseMultiplier)

  // Commission per job
  let totalCommission = 0
  let reviewBonus = 0
  const jobBreakdowns: DailyPayResult['breakdown']['jobs'] = []

  for (const job of jobs) {
    // Commission rate — helper gets 20% if job ≥ $300
    let rate = config.commissionRate
    if (role === 'helper' && job.finalPrice >= HELPER_HIGH_COMMISSION_THRESHOLD) {
      rate = HELPER_HIGH_COMMISSION_RATE
    }

    const commission = Math.round(job.finalPrice * rate)
    totalCommission += commission

    // Review bonus
    let jobReviewBonus = 0
    if (job.hasReview && job.reviewRating === 5) {
      jobReviewBonus = FIVE_STAR_BONUS_PER_JOB
      reviewBonus += jobReviewBonus
    }

    jobBreakdowns.push({
      bookingId: job.bookingId,
      commission,
      reviewBonus: jobReviewBonus,
    })
  }

  // daily_pay = max(adjusted_base, total_commission) + review_bonus
  const dailyPay = Math.max(adjustedBase, totalCommission) + reviewBonus

  return {
    crewMemberId,
    role,
    date,
    jobCount,
    adjustedBase,
    totalCommission,
    reviewBonus,
    dailyPay,
    breakdown: {
      fullBase: config.baseDailyPay,
      baseMultiplier,
      jobs: jobBreakdowns,
    },
  }
}

// ---------------------------------------------------------------------------
// Weekly Pay Summary
// ---------------------------------------------------------------------------

export function calculateWeeklyPay(
  crewMemberId: string,
  role: CrewRole,
  weekStart: string,
  weekEnd: string,
  dailyResults: DailyPayResult[],
  allJobsThisWeek: CompletedJob[],
): WeeklyPaySummary {
  const totalDailyPay = dailyResults.reduce((sum, d) => sum + d.dailyPay, 0)
  const totalJobs = dailyResults.reduce((sum, d) => sum + d.jobCount, 0)
  const totalRevenue = allJobsThisWeek.reduce((sum, j) => sum + j.finalPrice, 0)

  // Count 5-star reviews this week
  const fiveStarCount = allJobsThisWeek.filter(
    (j) => j.hasReview && j.reviewRating === 5,
  ).length

  // Weekly bonus for 10+ five-star reviews
  const weeklyReviewBonus = fiveStarCount >= WEEKLY_REVIEW_BONUS_THRESHOLD
    ? WEEKLY_REVIEW_BONUS
    : 0

  return {
    crewMemberId,
    role,
    weekStart,
    weekEnd,
    totalDailyPay,
    weeklyReviewBonus,
    totalPay: totalDailyPay + weeklyReviewBonus,
    totalJobs,
    totalRevenue,
    fiveStarCount,
    dailyBreakdowns: dailyResults,
  }
}

// ---------------------------------------------------------------------------
// Review Credit Config (customer rewards)
// ---------------------------------------------------------------------------

export const REVIEW_CREDIT_CONFIG = {
  ANY_REVIEW_CREDIT: 1000,       // $10 in cents for any approved review
  CREDIT_EXPIRY_DAYS: 90,        // 90 days
  MAX_ACTIVE_CREDITS: 3,         // max active credits per customer
}

// ---------------------------------------------------------------------------
// Margin / Anti-Loss Helpers
// ---------------------------------------------------------------------------

/** Check if a job is profitable (revenue > labor cost) */
export function isJobProfitable(
  finalPrice: number,
  crewCosts: { role: CrewRole; dailyPay: number }[],
): boolean {
  const totalLabor = crewCosts.reduce((sum, c) => sum + c.dailyPay, 0)
  return finalPrice > totalLabor
}

/** Calculate margin for a single job */
export function calculateJobMargin(
  finalPrice: number,
  laborCost: number,
  suppliesCost: number = 0,
): { margin: number; marginPercent: number; profitable: boolean } {
  const totalCost = laborCost + suppliesCost
  const margin = finalPrice - totalCost
  const marginPercent = finalPrice > 0 ? (margin / finalPrice) * 100 : 0
  return { margin, marginPercent, profitable: margin > 0 }
}
