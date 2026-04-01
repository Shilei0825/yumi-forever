import Link from "next/link"
import {
  Truck,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  CalendarCheck,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroVideo } from "@/components/hero-video"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BRAND, FLEET_SERVICES } from "@/lib/constants"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Truck & Fleet Washing Services in NJ & NYC',
  description:
    'Commercial fleet washing, truck detailing, and recurring fleet service contracts in New Jersey and NYC. On-site service, volume pricing, and dedicated crews. Get a custom quote from Yumi Forever.',
  keywords: [
    'fleet washing NJ', 'truck wash NYC', 'commercial fleet cleaning NJ',
    'fleet detailing service', 'truck detailing NJ', 'van washing service NJ',
    'mobile fleet wash NYC', 'fleet cleaning contract NJ',
  ],
  openGraph: {
    title: 'Truck & Fleet Washing Services | Yumi Forever | NJ & NYC',
    description:
      'Fleet washing and truck detailing in NJ & NYC. Custom contracts, on-site service, and volume pricing for businesses of all sizes.',
  },
  alternates: { canonical: 'https://yumiforever.com/services/truck-fleet' },
}

const BENEFITS = [
  {
    title: "On-Site Service",
    description:
      "We come to your lot, depot, or office. No need to take vehicles off the road.",
    icon: Building2,
  },
  {
    title: "Volume Pricing",
    description:
      "Custom pricing based on fleet size and service frequency. The more you book, the more you save.",
    icon: BarChart3,
  },
  {
    title: "Recurring Contracts",
    description:
      "Set it and forget it. Schedule weekly, bi-weekly, or monthly service with guaranteed availability.",
    icon: CalendarCheck,
  },
  {
    title: "Dedicated Crew",
    description:
      "A dedicated team that knows your fleet, your schedule, and your standards.",
    icon: Users,
  },
]

const INDUSTRIES = [
  {
    title: "Trucking & Logistics",
    description: "Keep your fleet clean, branded, and road-ready at all times.",
  },
  {
    title: "Car Dealerships",
    description: "Lot wash, detail prep, and delivery detailing for new and pre-owned inventory.",
  },
  {
    title: "Ride-Share & Rental",
    description: "Fast turnaround cleaning and detailing between bookings.",
  },
  {
    title: "Construction & Utilities",
    description: "Heavy-duty cleaning for work trucks, vans, and equipment vehicles.",
  },
]

export default function TruckFleetPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroVideo videos={["/hero-fleet.mp4"]} />
          <div className="absolute inset-0 bg-violet-950/75" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/20">
              <Truck className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Truck & Fleet
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Commercial Fleet Solutions
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            Keep your fleet looking professional with on-site washing, detailing, and
            recurring service contracts designed for businesses of every size.
          </p>
          <div className="mt-10">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/contact">
                Request a Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Fleet Services */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Fleet Services
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            All fleet services are custom-quoted based on your fleet size, vehicle types,
            and service frequency.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_SERVICES.map((service) => (
              <Card key={service.slug} className="flex flex-col">
                <CardHeader>
                  <Link href={`/services/${service.slug}`} className="hover:underline">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </Link>
                  <CardDescription className="text-base">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="border-t border-neutral-100 pt-4">
                    <p className="text-sm font-medium text-neutral-700">
                      Custom pricing based on fleet size
                    </p>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/services/${service.slug}`}>Details</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={`/contact?service=${service.slug}`}>Get Quote</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              We understand commercial needs require reliability, efficiency, and professional results.
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

      {/* Industries */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Industries We Serve
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            From single-vehicle operations to 500+ vehicle fleets, we scale to meet your needs.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {INDUSTRIES.map((industry) => (
              <div
                key={industry.title}
                className="flex items-start gap-4 rounded-lg border border-neutral-200 bg-white p-6"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    {industry.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {industry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to keep your fleet spotless?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
            Get a custom quote for your business. We will build a service plan that
            fits your schedule and budget.
          </p>
          <div className="mt-10">
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">
                Get a Quote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
