import Link from "next/link"
import { Car, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/constants"
import { HeroVideo } from "@/components/hero-video"
import ServiceTiers from "./service-tiers"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Auto Detailing & Car Wash Services in NJ & NYC',
  description:
    'Premium mobile auto detailing in New Jersey and NYC. Hand wash, interior detailing, paint correction, ceramic coating, and more. We come to your home or office. Book online with Yumi Forever.',
  keywords: [
    'auto detailing NJ', 'NJ auto detailing', 'mobile car wash NJ', 'car wash NJ',
    'car detailing NYC', 'ceramic coating NJ', 'paint correction NJ', 'interior detailing NJ',
    'hand car wash near me', 'mobile auto detailing NYC', 'express car wash NJ',
    'mobile car wash Secaucus', 'mobile car wash Hackensack', 'car detailing Hoboken',
    'auto detailing Jersey City', 'car wash Bergen County', 'mobile detailing Hudson County',
    'car detailing Fort Lee NJ', 'headlight restoration NJ',
  ],
  openGraph: {
    title: 'Auto Detailing & Car Wash | Yumi Forever | NJ & NYC',
    description:
      'Mobile auto detailing in NJ & NYC. Hand wash, ceramic coating, paint correction, interior detailing. Book online today.',
  },
  alternates: { canonical: 'https://yumiforever.com/services/auto-care' },
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroVideo videos={["/hero-car.mp4", "/hero-detail.mp4"]} />
          <div className="absolute inset-0 bg-violet-950/75" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
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
          <div className="mt-10">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/book">
                Get Instant Quote & Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services List — collapsible tiers */}
      <ServiceTiers />

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
              <Link href="/book">Get Instant Quote & Book Now</Link>
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
