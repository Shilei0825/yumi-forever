import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Clock, Check, DollarSign, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BRAND, AUTO_SERVICES, HOME_SERVICES, FLEET_SERVICES, SERVICES, VEHICLE_TYPES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

import type { Metadata } from "next"

// ---------------------------------------------------------------------------
// Combine all services
// ---------------------------------------------------------------------------

const ALL_SERVICES = [...AUTO_SERVICES, ...HOME_SERVICES, ...FLEET_SERVICES]

// ---------------------------------------------------------------------------
// What's Included — per service slug
// ---------------------------------------------------------------------------

const WHATS_INCLUDED: Record<string, string[]> = {
  // Auto
  "express-exterior": [
    "Hand wash with pH-balanced shampoo",
    "Bug and tar removal",
    "Wheel and tire cleaning",
    "Tire dressing",
    "Window cleaning (exterior)",
    "Door jamb wipe-down",
    "Spray wax finish",
    "Premium microfiber dry",
  ],
  "express-interior": [
    "Full vacuum (seats, carpets, mats, trunk)",
    "Dashboard and console wipe-down",
    "Door panel cleaning",
    "Interior glass cleaning",
    "Vent cleaning",
    "Cup holder and storage cleaning",
    "Air freshener",
  ],
  "express-in-out": [
    "Everything in Express Exterior",
    "Everything in Express Interior",
  ],
  "premium-exterior": [
    "Everything in Express Exterior",
    "Clay bar decontamination",
    "One-step polish / light paint correction",
    "Synthetic sealant / spray ceramic",
    "Trim restoration",
    "Exhaust tip polish",
  ],
  "premium-interior": [
    "Everything in Express Interior",
    "Deep steam / hot water extraction (carpets and upholstery)",
    "Leather cleaning and conditioning",
    "Stain treatment",
    "Headliner spot clean",
    "UV protectant on plastics",
  ],
  "premium-detail": [
    "Everything in Premium Exterior",
    "Everything in Premium Interior",
    "Engine bay cleaning",
    "Full paint correction consultation",
    "Final inspection under LED lights",
  ],
  // Home
  "standard-cleaning": [
    "Kitchen cleaning (counters, sink, appliances exterior)",
    "Bathroom cleaning (toilet, shower, sink, mirror)",
    "Dusting all surfaces and furniture",
    "Vacuuming and mopping all floors",
    "Bedroom tidying and bed making",
    "Trash removal",
  ],
  "deep-cleaning": [
    "Everything in Standard Cleaning",
    "Inside cabinet and drawer cleaning",
    "Baseboard and trim cleaning",
    "Appliance interior cleaning (oven, fridge)",
    "Light fixture and ceiling fan cleaning",
    "Window sill and track cleaning",
    "Grout scrubbing",
  ],
  "move-in-move-out-cleaning": [
    "Top-to-bottom deep clean of all rooms",
    "Inside all cabinets, closets, and drawers",
    "Full appliance cleaning (interior and exterior)",
    "Window and window track cleaning",
    "Baseboard, trim, and door cleaning",
    "Light switch and outlet plate sanitization",
    "Garage sweep (if applicable)",
  ],
  "carpet-cleaning": [
    "Professional hot water extraction",
    "Pre-treatment of high-traffic areas",
    "Stain spot treatment",
    "Deodorizing treatment",
    "Furniture moving (light items)",
    "Post-clean grooming of carpet fibers",
  ],
  // Fleet
  "fleet-wash": [
    "Exterior wash for all fleet vehicles",
    "Wheel and tire cleaning",
    "On-site service at your facility",
    "Custom scheduling for your fleet",
    "Volume pricing available",
  ],
  "fleet-detailing": [
    "Full interior and exterior detail",
    "Customized to your fleet needs",
    "On-site mobile service",
    "Dedicated crew assigned to your account",
    "Flexible scheduling",
  ],
  "commercial-contract": [
    "Recurring service at agreed intervals",
    "Custom scope of work per vehicle type",
    "Dedicated account manager",
    "Priority scheduling",
    "Volume discounts",
    "Monthly invoicing",
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getService(slug: string) {
  return ALL_SERVICES.find((s) => s.slug === slug) ?? null
}

function getBookingUrl(slug: string): string {
  if (HOME_SERVICES.some((s) => s.slug === slug)) return `/book/home?service=${slug}`
  if (FLEET_SERVICES.some((s) => s.slug === slug)) return `/contact?service=${slug}`
  return `/book?service=${slug}` // auto services
}

function getRelatedServices(slug: string) {
  // Find which category this service belongs to and return others from same category
  const autoSlugs = AUTO_SERVICES.map((s) => s.slug)
  const homeSlugs = HOME_SERVICES.map((s) => s.slug)
  const fleetSlugs = FLEET_SERVICES.map((s) => s.slug)

  if (autoSlugs.includes(slug)) {
    return AUTO_SERVICES.filter((s) => s.slug !== slug)
  }
  if (homeSlugs.includes(slug)) {
    return HOME_SERVICES.filter((s) => s.slug !== slug)
  }
  if (fleetSlugs.includes(slug)) {
    return FLEET_SERVICES.filter((s) => s.slug !== slug)
  }
  return ALL_SERVICES.filter((s) => s.slug !== slug).slice(0, 3)
}

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return ALL_SERVICES.map((s) => ({ slug: s.slug }))
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return { title: `Service Not Found | ${BRAND.name}` }

  const title = `${service.name} in NJ & NYC | ${BRAND.name}`
  const description = `${service.description} Professional ${service.name.toLowerCase()} service in New Jersey and New York City. Book online or request a quote from ${BRAND.name}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    alternates: {
      canonical: `https://yumiforever.com/services/${slug}`,
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = getService(slug)
  if (!service) notFound()

  const related = getRelatedServices(slug)
  const included = WHATS_INCLUDED[slug] ?? []

  // JSON-LD structured data for this service
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: BRAND.name,
      url: 'https://yumiforever.com',
    },
    areaServed: [
      { '@type': 'State', name: 'New Jersey' },
      { '@type': 'City', name: 'New York City' },
    ],
    url: `https://yumiforever.com/services/${slug}`,
    ...(service.basePrice > 0 && !service.requiresQuote
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: service.basePrice,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero + What's Included */}
      <section className="bg-dark py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-neutral-400">
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <span>/</span>
            <span className="text-white">{service.name}</span>
          </nav>

          <div className="mt-10 lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left: Service Info + CTAs */}
            <div>
              {/* Tier badge for auto services */}
              {(() => {
                const svcDef = SERVICES.find((s) => s.slug === slug)
                if (!svcDef) return null
                return svcDef.tier === 'express' ? (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
                    <Zap className="h-3.5 w-3.5" /> Express Service
                  </span>
                ) : (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-sm font-medium text-violet-300">
                    <Crown className="h-3.5 w-3.5" /> Premium Service
                  </span>
                )
              })()}

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {service.name}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">
                {service.description}
              </p>

              {/* Vehicle-based pricing for auto services */}
              {(() => {
                const svcDef = SERVICES.find((s) => s.slug === slug)
                if (svcDef) {
                  return (
                    <div className="mt-6 space-y-2">
                      {VEHICLE_TYPES.map((vt) => (
                        <div key={vt.key} className="flex items-center justify-between max-w-xs text-neutral-300">
                          <span className="text-sm">{vt.label}</span>
                          <span className="font-semibold text-white">{formatCurrency(svcDef.pricing[vt.key])}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                // Fallback for non-auto services
                return !service.requiresQuote && service.basePrice > 0 ? (
                  <div className="mt-6 flex items-center gap-2 text-neutral-300">
                    <DollarSign className="h-5 w-5" />
                    <span>Starting at {formatCurrency(service.basePrice)}</span>
                  </div>
                ) : null
              })()}

              <div className="mt-4 flex flex-wrap items-center gap-6">
                {service.duration > 0 && (
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Clock className="h-5 w-5" />
                    <span>~{service.duration} min</span>
                  </div>
                )}
              </div>

              {service.requiresDeposit && 'depositAmount' in service && (service.depositAmount as number) > 0 && (
                <p className="mt-4 text-sm text-neutral-400">
                  Deposit of {formatCurrency(service.depositAmount as number)} to confirm your booking.
                </p>
              )}

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                {service.requiresQuote ? (
                  <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
                    <Link href={`/contact?service=${slug}`}>
                      Request a Quote
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
                    <Link href={getBookingUrl(slug)}>
                      Book This Service
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>

            </div>

            {/* Right: What's Included */}
            {included.length > 0 && (
              <div className="mt-12 lg:mt-0">
                <h2 className="text-lg font-semibold uppercase tracking-wide text-neutral-400">
                  What&apos;s Included
                </h2>
                <ul className="mt-6 space-y-3">
                  {included.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-base text-neutral-200"
                    >
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Book CTA */}
      <section className="bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Ready to book?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Schedule your {service.name.toLowerCase()} today. We come to you
              anywhere in the NYC and NJ area.
            </p>
            <div className="mt-10">
              {service.requiresQuote ? (
                <Button size="lg" asChild>
                  <Link href={`/contact?service=${slug}`}>
                    Request a Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild>
                  <Link href={getBookingUrl(slug)}>
                    Book This Service
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      {related.length > 0 && (
        <section className="bg-white py-16 pb-mobile-cta sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Related Services
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              Explore other services you might be interested in.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/services/${rel.slug}`}
                  className="rounded-lg border border-neutral-200 p-6 transition-colors hover:border-neutral-400"
                >
                  <h3 className="text-lg font-bold text-neutral-900">
                    {rel.name}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                    {rel.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">
                      {rel.requiresQuote
                        ? "Request a Quote"
                        : formatCurrency(rel.basePrice)}
                    </span>
                    {rel.duration > 0 && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />~{rel.duration} min
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
