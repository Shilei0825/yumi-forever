import Link from "next/link"
import {
  Sparkles,
  Car,
  Truck,
  Building2,
  ArrowRight,
  Clock,
  Zap,
  Crown,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BRAND, HOME_SERVICES, AUTO_SERVICES, FLEET_SERVICES, SERVICES, OFFICE_PLANS, OFFICE_SIZES, CLEANING_FREQUENCIES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import {
  getHomeServicePriceRange,
} from "@/lib/pricing-engine"
import type { HomeServiceType } from "@/lib/pricing-engine"
import { ServicesCategoryTabs } from "./services-tabs"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Cleaning & Detailing Services in NJ & NYC',
  description:
    'Explore Yumi Forever\'s full range of services: mobile auto detailing, professional home cleaning, office cleaning, and fleet washing across New Jersey and New York City. Book online today.',
  keywords: [
    'cleaning services NJ', 'detailing services NYC', 'auto detailing NJ',
    'home cleaning NYC', 'office cleaning NJ', 'fleet washing NJ',
    'yumi forever services', 'professional cleaning near me',
    'cleaning services Secaucus', 'detailing services Secaucus',
    'cleaning services Hackensack', 'cleaning services Jersey City',
    'detailing services Hoboken', 'cleaning services Fort Lee NJ',
    'cleaning services Bergen County', 'cleaning services Hudson County',
  ],
  openGraph: {
    title: 'Cleaning & Detailing Services | Yumi Forever | NJ & NYC',
    description:
      'Auto detailing, home cleaning, office cleaning, and fleet washing services in NJ & NYC. View all services and book online.',
  },
  alternates: { canonical: 'https://yumiforever.com/services' },
}

const CATEGORIES = [
  {
    id: "auto-care",
    title: "Auto Care",
    description:
      "Premium mobile detailing delivered to your driveway. Hand washes, interior detailing, paint correction, ceramic coating, and more.",
    icon: Car,
    href: "/services/auto-care",
    bookHref: "/book",
    services: AUTO_SERVICES,
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "home-care",
    title: "Home Care",
    description:
      "Professional cleaning services for homes and apartments. From routine cleaning to deep sanitization, our trained crews leave every surface spotless.",
    icon: Sparkles,
    href: "/services/home-care",
    bookHref: "/book/home",
    services: HOME_SERVICES,
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "office-commercial",
    title: "Office & Commercial",
    description:
      "Recurring professional office cleaning with flexible daily, weekly, or monthly plans. Three tiers to fit every budget and need.",
    icon: Building2,
    href: "/services/office-commercial",
    bookHref: "/book/office",
    services: [],
    color: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    id: "truck-fleet",
    title: "Truck & Fleet",
    description:
      "Commercial-grade washing and detailing for fleets of any size. Custom contracts, volume pricing, and on-site service for businesses.",
    icon: Truck,
    href: "/services/truck-fleet",
    bookHref: "/contact",
    services: FLEET_SERVICES,
    color: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
]

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-12 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Our Services
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              {BRAND.description} Browse our service categories below to find the perfect solution
              for your home, vehicle, or business.
            </p>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <ServicesCategoryTabs />

      {/* Service Categories */}
      <section className="bg-white py-12 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {CATEGORIES.map((category, index) => (
              <div
                key={category.title}
                id={category.id}
                className={`scroll-mt-32 ${index > 0 ? "border-t border-neutral-200 pt-20" : ""}`}
              >
                <div className="lg:grid lg:grid-cols-5 lg:gap-12">
                  {/* Category Info */}
                  <div className="lg:col-span-2">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${category.color}`}>
                      <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
                      {category.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600">
                      {category.description}
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button asChild>
                        <Link href={category.href}>
                          View All {category.title} Services
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={category.bookHref}>
                          Book Now
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Service List */}
                  <div className="mt-10 lg:col-span-3 lg:mt-0">
                    {category.id === 'auto-care' ? (
                      /* Auto Care: two-column Express / Premium layout */
                      <div className="grid gap-8 sm:grid-cols-2">
                        {/* Express column */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
                              <Zap className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Express</h3>
                          </div>
                          <div className="space-y-4">
                            {SERVICES.filter((s) => s.tier === 'express').map((svc) => (
                              <Link key={svc.slug} href={`/services/${svc.slug}`}>
                                <Card className="h-full hover:border-neutral-400">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{svc.name}</CardTitle>
                                    <CardDescription>{svc.description}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-neutral-900">
                                        {formatCurrency(svc.pricing.sedan)} – {formatCurrency(svc.pricing.large_suv)}
                                      </span>
                                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                                        <Clock className="h-3 w-3" />
                                        ~{svc.duration} min
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>

                        {/* Premium column */}
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100">
                              <Crown className="h-4 w-4 text-violet-600" />
                            </div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700">Premium</h3>
                          </div>
                          <div className="space-y-4">
                            {SERVICES.filter((s) => s.tier === 'premium').map((svc) => (
                              <Link key={svc.slug} href={`/services/${svc.slug}`}>
                                <Card className={`h-full hover:border-neutral-400 ${svc.popular ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-base">{svc.name}</CardTitle>
                                      {svc.popular && (
                                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                                          Most Popular
                                        </span>
                                      )}
                                    </div>
                                    <CardDescription>{svc.description}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-neutral-900">
                                        {formatCurrency(svc.pricing.sedan)} – {formatCurrency(svc.pricing.large_suv)}
                                      </span>
                                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                                        <Clock className="h-3 w-3" />
                                        ~{svc.duration} min
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : category.id === 'office-commercial' ? (
                      /* Office & Commercial: plan cards */
                      <div className="grid gap-4 sm:grid-cols-3">
                        {OFFICE_PLANS.map((plan) => (
                          <Card key={plan.slug} className={`h-full ${plan.popular ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{plan.name}</CardTitle>
                                {plan.popular && (
                                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                                    Most Popular
                                  </span>
                                )}
                              </div>
                              <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-3">
                                <span className="text-lg font-bold text-neutral-900">
                                  {formatCurrency(plan.pricing.small.monthly)}
                                </span>
                                <span className="text-xs text-neutral-500">/mo starting</span>
                              </div>
                              <ul className="space-y-1.5">
                                {plan.features.slice(0, 4).map((f) => (
                                  <li key={f} className="flex items-start gap-1.5 text-xs text-neutral-600">
                                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-violet-700" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      /* Home Care & Fleet: standard grid */
                      <div className="grid gap-4 sm:grid-cols-2">
                        {category.services.map((service) => (
                          <Link key={service.slug} href={`/services/${service.slug}`}>
                            <Card className="h-full hover:border-neutral-400">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">{service.name}</CardTitle>
                                <CardDescription>{service.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-neutral-900">
                                    {service.requiresQuote
                                      ? "Request a Quote"
                                      : (() => {
                                          if (category.id === 'home-care' && 'serviceType' in service) {
                                            const range = getHomeServicePriceRange(service.serviceType as HomeServiceType)
                                            return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`
                                          }
                                          return formatCurrency(service.basePrice)
                                        })()}
                                  </span>
                                  {service.duration > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                                      <Clock className="h-3 w-3" />
                                      ~{service.duration} min
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-50 py-12 pb-mobile-cta sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Not sure which service you need?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Contact us and we will help you find the perfect solution for your needs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="#categories">Book a Service</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
