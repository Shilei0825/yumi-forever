import Link from "next/link"
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  CalendarCheck,
  Shield,
  BarChart3,
  Calculator,
} from "lucide-react"
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
  OFFICE_PLANS,
  OFFICE_SIZES,
  CLEANING_FREQUENCIES,
  OFFICE_ADDONS,
  CONTRACT_DISCOUNTS,
} from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Office & Commercial Cleaning | ${BRAND.name}`,
  description:
    "Professional office and commercial cleaning with flexible daily, weekly, and monthly plans for businesses of all sizes.",
}

const HIGHLIGHTS = [
  "Customizable cleaning schedules (daily to quarterly)",
  "Background-checked, insured cleaning crews",
  "Eco-friendly, commercial-grade products",
  "Dedicated account manager for Premier plans",
  "Monthly facility reports available",
  "Volume discounts for long-term contracts",
]

const BENEFITS = [
  {
    title: "Flexible Scheduling",
    description:
      "Choose daily, 3x/week, weekly, bi-weekly, monthly, or quarterly cleaning to match your needs.",
    icon: CalendarCheck,
  },
  {
    title: "Dedicated Teams",
    description:
      "Get a consistent crew that knows your space, your preferences, and your standards.",
    icon: Users,
  },
  {
    title: "Insured & Bonded",
    description:
      "Full liability coverage and bonded employees for your peace of mind.",
    icon: Shield,
  },
  {
    title: "Contract Savings",
    description:
      "Save up to 15% with long-term agreements. Flexible month-to-month options also available.",
    icon: BarChart3,
  },
]

export default function OfficeCommercialPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/20">
              <Building2 className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Office & Commercial
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Office & Commercial Cleaning
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            Keep your workspace spotless with recurring professional cleaning.
            Flexible plans from daily service to quarterly deep cleans, tailored
            to offices from 500 to 10,000+ sq ft.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/book/office">
                Get Instant Quote & Book Now
                <Calculator className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">
                Talk to Agent for Customized Service
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Plans Overview */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Cleaning Plans
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            Three tiers designed for every need — from basic maintenance to full-service
            premium care with dedicated account management.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {OFFICE_PLANS.map((plan) => (
              <Link
                key={plan.slug}
                href="/book/office"
                className={`flex flex-col rounded-xl border bg-white transition-colors hover:border-neutral-400 ${plan.popular ? 'relative border-2 border-violet-700 hover:border-violet-700' : 'border-neutral-200'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-700 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900">{plan.name}</h3>
                  <p className="mt-1 text-base text-neutral-500">{plan.description}</p>
                </div>
                <div className="flex flex-1 flex-col px-6 pb-6">
                  {/* Sample pricing */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-neutral-500">Starting at</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {formatCurrency(plan.pricing.small.monthly)}
                      <span className="text-base font-normal text-neutral-500">/mo</span>
                    </p>
                    <p className="text-xs text-neutral-500">Small office, monthly cleaning</p>
                  </div>

                  <ul className="flex-1 space-y-2 border-t border-neutral-100 pt-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                        <span className="text-sm text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <span
                      className={`flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${plan.popular ? 'bg-primary text-white' : 'border border-neutral-200 text-neutral-900'}`}
                    >
                      Get a Quote <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Pricing by Size & Frequency
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            Monthly rates vary by office size and cleaning frequency. All prices shown are per month.
          </p>

          {OFFICE_PLANS.map((plan) => (
            <div key={plan.slug} className="mt-12">
              <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="pb-3 pr-4 text-left font-medium text-neutral-500">
                        Office Size
                      </th>
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
          <div className="mt-12 rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="text-lg font-bold text-neutral-900">Contract Discounts</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Save more with longer commitments. Discounts apply to all plan pricing.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {CONTRACT_DISCOUNTS.map((cd) => (
                <div key={cd.months} className="rounded-lg border border-neutral-200 p-4 text-center">
                  <p className="text-sm font-medium text-neutral-600">{cd.label}</p>
                  <p className="mt-1 text-2xl font-bold text-violet-700">
                    {cd.discount > 0 ? `${cd.discount * 100}% off` : 'No commitment'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-On Services */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Add-On Services
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            Enhance your cleaning plan with specialized services priced separately.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OFFICE_ADDONS.map((addon) => (
              <div
                key={addon.id}
                className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                <div>
                  <p className="font-medium text-neutral-900">{addon.name}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {'pricePerSqFt' in addon && `${formatCurrency((addon as { pricePerSqFt: number }).pricePerSqFt)}/sq ft`}
                    {'pricePerPane' in addon && `${formatCurrency((addon as { pricePerPane: number }).pricePerPane)}/pane`}
                    {'pricePerWindow' in addon && `${formatCurrency((addon as { pricePerWindow: number }).pricePerWindow)}/window`}
                    {'pricePerPiece' in addon && `${formatCurrency((addon as { pricePerPiece: number }).pricePerPiece)}/piece`}
                    {'pricePerDay' in addon && `${formatCurrency((addon as { pricePerDay: number }).pricePerDay)}/day`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Why Businesses Choose {BRAND.name}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Reliable, professional, and tailored to your business needs.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                  <benefit.icon className="h-6 w-6 text-violet-700" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                The {BRAND.name} Difference
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                We understand that a clean workspace is essential for productivity,
                employee health, and making a great impression on clients.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <ul className="space-y-4">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                    <span className="text-base text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready for a cleaner workspace?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            Get a custom quote for your office or commercial space. We will build a
            cleaning plan that fits your schedule and budget.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/book/office">
                Get Instant Quote & Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Talk to Agent</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
