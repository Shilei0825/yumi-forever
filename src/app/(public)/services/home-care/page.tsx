import Link from "next/link"
import {
  Sparkles,
  Clock,
  ArrowRight,
  CheckCircle2,
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
import { BRAND, HOME_SERVICES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Home Cleaning Services in NJ & NYC',
  description:
    'Professional home cleaning services in New Jersey and NYC. Standard cleaning, deep cleaning, move-in/move-out cleaning, and carpet cleaning. Eco-friendly products, background-checked crews. Book online with Yumi Forever.',
  keywords: [
    'home cleaning NJ', 'house cleaning NYC', 'deep cleaning NJ',
    'move out cleaning NJ', 'move in cleaning NYC', 'carpet cleaning NJ',
    'maid service NJ', 'professional house cleaning near me', 'eco-friendly cleaning NJ',
    'home cleaning Secaucus', 'Secaucus home cleaning', 'house cleaning Secaucus',
    'home cleaning Hackensack', 'house cleaning Hackensack',
    'home cleaning Jersey City', 'house cleaning Jersey City',
    'home cleaning Hoboken', 'maid service Hoboken',
    'home cleaning Fort Lee NJ', 'house cleaning Fort Lee',
    'home cleaning Bergen County', 'house cleaning Hudson County',
    'home cleaning near me NJ', 'deep cleaning near me NJ',
  ],
  openGraph: {
    title: 'Home Cleaning Services | Yumi Forever | NJ & NYC',
    description:
      'Professional home cleaning in NJ & NYC. Deep cleaning, move-in/move-out, carpet cleaning, and more. Book online today.',
  },
  alternates: { canonical: 'https://yumiforever.com/services/home-care' },
}

const HIGHLIGHTS = [
  "Background-checked, trained professionals",
  "Eco-friendly, pet-safe cleaning products",
  "Same crew assigned to your home each visit",
  "Flexible rescheduling up to 24 hours before",
  "All supplies and equipment included",
  "100% satisfaction guarantee",
]

export default function HomeCarePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroVideo videos={["/hero-home.mp4"]} />
          <div className="absolute inset-0 bg-violet-950/75" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600/20">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Home Care
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Professional Home Cleaning
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
            From weekly maintenance to deep cleans and move-in/move-out services,
            our certified crews bring the sparkle to every corner of your home.
          </p>
          <div className="mt-10">
            <Button size="lg" className="bg-white text-primary hover:bg-neutral-100" asChild>
              <Link href="/book/home">
                Get Instant Quote & Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Our Home Care Services
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-neutral-600">
            Choose the service that fits your needs. All services include eco-friendly products
            and professional equipment.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {HOME_SERVICES.map((service) => (
              <Card key={service.slug} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/services/${service.slug}`} className="hover:underline">
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                      </Link>
                      <CardDescription className="mt-2 text-base">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-end">
                  <div className="flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-4">
                    <div>
                      <span className="text-2xl font-bold text-neutral-900">
                        {formatCurrency(service.basePrice)}
                      </span>
                      <span className="ml-1 text-sm text-neutral-500">starting</span>
                    </div>
                    {service.duration > 0 && (
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        <Clock className="h-4 w-4" />
                        <span>~{service.duration} min</span>
                      </div>
                    )}
                    {service.requiresDeposit && (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                        Deposit: {formatCurrency(service.depositAmount ?? 0)}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/services/${service.slug}`}>Details</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={`/book/home?service=${service.slug}`}>Get Instant Quote</Link>
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
                Every home cleaning comes with our commitment to quality, safety, and
                your complete satisfaction. Here is what sets us apart.
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
            Ready for a spotless home?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Book your first cleaning today. Save even more with a monthly membership plan.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/book/home">Get Instant Quote & Book Now</Link>
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
