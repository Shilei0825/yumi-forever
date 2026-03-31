import Link from "next/link"
import {
  Car,
  Clock,
  ArrowRight,
  CheckCircle2,
  Zap,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BRAND, AUTO_SERVICES, SERVICES, VEHICLE_TYPES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: `Auto Care Services | ${BRAND.name}`,
  description:
    "Premium mobile auto detailing including hand wash, interior detailing, paint correction, ceramic coating, and more.",
}

const HIGHLIGHTS = [
  "Mobile service -- we come to your home or office",
  "Professional-grade tools and products",
  "Trained and certified detailing specialists",
  "Paint-safe wash techniques only",
  "Interior sanitization included",
  "Before and after photos provided",
]

export default function AutoCarePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/20">
              <Car className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Auto Care
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Premium Auto Detailing
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            From a quick exterior wash to full paint correction and ceramic coating,
            our detailing experts bring the showroom to your driveway.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/book">
                Book Auto Detailing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Request a Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Our Auto Care Services
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            Every service is performed by trained professionals using premium products
            that protect your vehicle&apos;s finish.
          </p>

          {/* Express Services */}
          <div className="mt-12 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-amber-700">Express Services</h3>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {SERVICES.filter((s) => s.tier === 'express').map((service) => (
              <Card key={service.slug} className="flex flex-col">
                <CardHeader>
                  <Link href={`/services/${service.slug}`} className="hover:underline">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </Link>
                  <CardDescription className="mt-2 text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    {VEHICLE_TYPES.map((vt) => (
                      <div key={vt.key} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">{vt.label}</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(service.pricing[vt.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ~{service.duration} min
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                      Deposit: {formatCurrency(service.depositAmount)}
                    </span>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/services/${service.slug}`}>Details</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={`/book?service=${service.slug}`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Premium Services */}
          <div className="mt-16 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Crown className="h-4 w-4 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-violet-700">Premium Services</h3>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {SERVICES.filter((s) => s.tier === 'premium').map((service) => (
              <Card key={service.slug} className={`flex flex-col ${service.popular ? 'border-primary/30 ring-1 ring-primary/10' : ''}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Link href={`/services/${service.slug}`} className="hover:underline">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                    </Link>
                    {service.popular && (
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-2 text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    {VEHICLE_TYPES.map((vt) => (
                      <div key={vt.key} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">{vt.label}</span>
                        <span className="font-semibold text-neutral-900">
                          {formatCurrency(service.pricing[vt.key])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      ~{service.duration} min
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                      Deposit: {formatCurrency(service.depositAmount)}
                    </span>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/services/${service.slug}`}>Details</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={`/book?service=${service.slug}`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                The {BRAND.name} Difference
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                We treat every vehicle like it is our own. Our team uses only the best
                techniques and products to deliver results you will love.
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
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Your vehicle deserves the best
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Book a detailing appointment or save with our monthly auto care membership.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/book">Book Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
