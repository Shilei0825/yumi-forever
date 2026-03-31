import Link from "next/link"
import { Car, Sparkles, Truck, Building2, ArrowRight, Clock, CheckCircle2, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  BRAND,
  SERVICES,
  VEHICLE_TYPES,
  ADDONS,
  HOME_SERVICES,
  FLEET_SERVICES,
  MEMBERSHIP_PLANS,
  OFFICE_PLANS,
  OFFICE_SIZES,
  CLEANING_FREQUENCIES,
  CONTRACT_DISCOUNTS,
} from "@/lib/constants"
import {
  getHomeServicePriceRange,
} from "@/lib/pricing-engine"
import type { HomeServiceType } from "@/lib/pricing-engine"
import { formatCurrency } from "@/lib/utils"
import { PricingCategoryTabs } from "./pricing-tabs"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Pricing | ${BRAND.name}`,
  description:
    "Transparent pricing for home cleaning, auto detailing, and fleet services. No hidden fees.",
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Transparent Pricing
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-violet-200">
              No hidden fees, no surprises. Browse pricing for all of our
              services — auto care, home cleaning, and commercial fleet — and
              book with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Category Tabs */}
      <PricingCategoryTabs />

      {/* ------------------------------------------------------------------ */}
      {/* Auto Care Section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="auto-care" className="scroll-mt-32 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Car className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Auto Care Services
            </h2>
          </div>
          <p className="mt-4 max-w-2xl text-base text-neutral-600">
            Professional mobile detailing brought to your door. Exact pricing
            by vehicle type — no surprises.
          </p>

          {/* Desktop Table */}
          <div className="mt-10 hidden overflow-hidden rounded-lg border border-neutral-200 lg:block">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                    Service
                  </th>
                  {VEHICLE_TYPES.map((vt) => (
                    <th
                      key={vt.key}
                      className="px-6 py-4 text-left text-sm font-semibold text-neutral-900"
                    >
                      {vt.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                    Deposit
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-900">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {/* Express tier header */}
                <tr className="bg-amber-50/60">
                  <td colSpan={VEHICLE_TYPES.length + 3} className="px-6 py-2.5">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Express Services
                      </span>
                    </div>
                  </td>
                </tr>
                {SERVICES.filter((s) => s.tier === 'express').map((service) => (
                  <tr
                    key={service.slug}
                    className="hover:bg-neutral-50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-sm font-medium text-neutral-900 hover:underline"
                        >
                          {service.name}
                        </Link>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {service.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        ~{service.duration} min
                      </div>
                    </td>
                    {VEHICLE_TYPES.map((vt) => (
                      <td
                        key={vt.key}
                        className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-neutral-900"
                      >
                        {formatCurrency(service.pricing[vt.key])}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-neutral-600">
                      {formatCurrency(service.depositAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-right">
                      <Button size="sm" asChild>
                        <Link href={`/book?service=${service.slug}`}>Book</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Premium tier header */}
                <tr className="bg-violet-50/60">
                  <td colSpan={VEHICLE_TYPES.length + 3} className="px-6 py-2.5">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-violet-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                        Premium Services
                      </span>
                    </div>
                  </td>
                </tr>
                {SERVICES.filter((s) => s.tier === 'premium').map((service) => (
                  <tr
                    key={service.slug}
                    className={
                      service.popular
                        ? "bg-primary/[0.03]"
                        : "hover:bg-neutral-50"
                    }
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-sm font-medium text-neutral-900 hover:underline"
                        >
                          {service.name}
                        </Link>
                        {service.popular && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {service.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        ~{service.duration} min
                      </div>
                    </td>
                    {VEHICLE_TYPES.map((vt) => (
                      <td
                        key={vt.key}
                        className="whitespace-nowrap px-6 py-5 text-sm font-semibold text-neutral-900"
                      >
                        {formatCurrency(service.pricing[vt.key])}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-neutral-600">
                      {formatCurrency(service.depositAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-right">
                      <Button size="sm" asChild>
                        <Link href={`/book?service=${service.slug}`}>Book</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="mt-10 lg:hidden">
            {/* Express */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">Express Services</h3>
            </div>
            <div className="space-y-4">
              {SERVICES.filter((s) => s.tier === 'express').map((service) => (
                <div
                  key={service.slug}
                  className="rounded-lg border border-neutral-200 bg-white p-5"
                >
                  <h3 className="text-base font-semibold text-neutral-900">
                    <Link href={`/services/${service.slug}`} className="hover:underline">
                      {service.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{service.duration} min
                    </span>
                    <span>Deposit: {formatCurrency(service.depositAmount)}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {VEHICLE_TYPES.map((vt) => (
                      <div key={vt.key} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">{vt.label}</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(service.pricing[vt.key])}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/book?service=${service.slug}`}>Book</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium */}
            <div className="mb-3 mt-8 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-100">
                <Crown className="h-4 w-4 text-violet-600" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-700">Premium Services</h3>
            </div>
            <div className="space-y-4">
              {SERVICES.filter((s) => s.tier === 'premium').map((service) => (
                <div
                  key={service.slug}
                  className={`rounded-lg border p-5 ${
                    service.popular
                      ? "border-primary/30 bg-primary/[0.02]"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-900">
                      <Link href={`/services/${service.slug}`} className="hover:underline">
                        {service.name}
                      </Link>
                    </h3>
                    {service.popular && (
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{service.duration} min
                    </span>
                    <span>Deposit: {formatCurrency(service.depositAmount)}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {VEHICLE_TYPES.map((vt) => (
                      <div key={vt.key} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">{vt.label}</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(service.pricing[vt.key])}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Button size="sm" className="w-full" asChild>
                      <Link href={`/book?service=${service.slug}`}>Book</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-neutral-900">Add-ons</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Enhance any service with these extras. Prices vary by vehicle type.
            </p>

            {/* Desktop add-on table */}
            <div className="mt-4 hidden overflow-hidden rounded-lg border border-neutral-200 lg:block">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">Add-on</th>
                    {VEHICLE_TYPES.map((vt) => (
                      <th key={vt.key} className="px-6 py-3 text-left text-sm font-semibold text-neutral-900">
                        {vt.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {ADDONS.map((addon) => (
                    <tr key={addon.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-neutral-900">{addon.name}</p>
                        {addon.description && (
                          <p className="mt-0.5 text-xs text-neutral-500">{addon.description}</p>
                        )}
                      </td>
                      {VEHICLE_TYPES.map((vt) => (
                        <td key={vt.key} className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-neutral-900">
                          {addon.quoteOnly ? "Quote" : formatCurrency(addon.pricing[vt.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile add-on cards */}
            <div className="mt-4 space-y-3 lg:hidden">
              {ADDONS.map((addon) => (
                <div
                  key={addon.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <p className="text-sm font-medium text-neutral-900">{addon.name}</p>
                  {addon.description && (
                    <p className="mt-0.5 text-xs text-neutral-500">{addon.description}</p>
                  )}
                  {addon.quoteOnly ? (
                    <p className="mt-2 text-sm font-semibold text-neutral-900">Contact for pricing</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {VEHICLE_TYPES.map((vt) => (
                        <div key={vt.key} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600">{vt.label}</span>
                          <span className="font-semibold text-neutral-900">{formatCurrency(addon.pricing[vt.key])}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            All prices shown are estimates. Final price may be adjusted based
            on actual vehicle condition.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Home Care Section                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="home-care"
        className="scroll-mt-32 border-t border-neutral-200 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Home Care Services
            </h2>
          </div>
          <p className="mt-4 max-w-2xl text-base text-neutral-600">
            Professional home cleaning tailored to your space. Prices vary by
            home size, condition, and cleaning frequency.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_SERVICES.map((service) => {
              const range = getHomeServicePriceRange(
                service.serviceType as HomeServiceType
              )
              return (
                <Card
                  key={service.slug}
                  className="relative"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/services/${service.slug}`}
                        className="hover:underline"
                      >
                        {service.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-neutral-900">
                      {formatCurrency(range.min)}{" "}
                      <span className="text-base font-normal text-neutral-500">
                        &ndash;
                      </span>{" "}
                      {formatCurrency(range.max)}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-neutral-500">
                      <Clock className="h-4 w-4" />
                      ~{service.duration} min
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/services/${service.slug}`}>Details</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/book/home?service=${service.slug}`}>
                          Book Now
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            Prices vary by home size, condition, and cleaning frequency.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Office & Commercial Section                                         */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="office-commercial"
        className="scroll-mt-32 border-t border-neutral-200 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <Building2 className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Office & Commercial Cleaning
            </h2>
          </div>
          <p className="mt-4 max-w-2xl text-base text-neutral-600">
            Recurring professional cleaning with three plan tiers. Monthly pricing
            varies by office size and cleaning frequency.
          </p>

          {/* Plan comparison */}
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {OFFICE_PLANS.map((plan) => (
              <Link
                key={plan.slug}
                href="/book/office"
                className={`relative block rounded-xl border bg-white transition-colors hover:border-neutral-400 ${plan.popular ? 'border-2 border-violet-700 hover:border-violet-700' : 'border-neutral-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-700 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-3xl font-bold text-neutral-900">
                    {formatCurrency(plan.pricing.small.monthly)}
                    <span className="text-base font-normal text-neutral-500">
                      /mo
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">Small office, monthly</p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <span
                      className={`flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium ${plan.popular ? 'bg-primary text-white' : 'border border-neutral-200 text-neutral-900'}`}
                    >
                      Get a Quote <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pricing tables */}
          {OFFICE_PLANS.map((plan) => (
            <div key={plan.slug} className="mt-12">
              <h3 className="text-lg font-bold text-neutral-900">{plan.name} — Monthly Rates</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="pb-3 pr-4 text-left font-medium text-neutral-500">Office Size</th>
                      {CLEANING_FREQUENCIES.map((freq) => (
                        <th key={freq.key} className="pb-3 px-3 text-center font-medium text-neutral-500">
                          {freq.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {OFFICE_SIZES.map((size) => (
                      <tr key={size.key} className="border-b border-neutral-100">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-neutral-900">{size.label}</p>
                          <p className="text-xs text-neutral-500">{size.sqft}</p>
                        </td>
                        {CLEANING_FREQUENCIES.map((freq) => (
                          <td key={freq.key} className="py-3 px-3 text-center font-medium text-neutral-900">
                            {formatCurrency(plan.pricing[size.key][freq.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Contract Discounts */}
          <div className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="text-lg font-bold text-neutral-900">Contract Discounts</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {CONTRACT_DISCOUNTS.map((cd) => (
                <div key={cd.months} className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
                  <p className="text-sm font-medium text-neutral-600">{cd.label}</p>
                  <p className="mt-1 text-xl font-bold text-violet-700">
                    {cd.discount > 0 ? `${cd.discount * 100}% off` : 'Flexible'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            All office cleaning prices are monthly rates. Contact us for spaces larger
            than 10,000 sq ft or custom requirements.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Truck & Fleet Section                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="truck-fleet"
        className="scroll-mt-32 border-t border-neutral-200 bg-white py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Truck className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Truck & Fleet Services
            </h2>
          </div>
          <p className="mt-4 max-w-2xl text-base text-neutral-600">
            Custom fleet solutions for businesses of any size. All fleet
            services are quoted based on your specific needs.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_SERVICES.map((service) => (
              <Card
                key={service.slug}
                className="relative"
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/services/${service.slug}`}
                      className="hover:underline"
                    >
                      {service.name}
                    </Link>
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-700">
                    Custom Quote
                  </p>
                  <div className="mt-6">
                    <Button size="sm" asChild>
                      <Link href={`/contact?service=${service.slug}`}>
                        Get Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-sm text-neutral-500">
            All fleet services are custom-quoted based on fleet size and
            requirements.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Membership Plans                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Save with a Membership
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600">
              Lock in recurring savings with a monthly membership. Cancel
              anytime.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBERSHIP_PLANS.map((plan) => (
              <Card
                key={plan.slug}
                className="relative"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-neutral-900">
                    {formatCurrency(plan.price)}
                    <span className="text-base font-normal text-neutral-500">
                      /month
                    </span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm text-neutral-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-neutral-200 bg-white py-16 pb-mobile-cta sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Not sure which service you need?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Our team is happy to help you find the right service for your needs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/book">
                Book a Service
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
