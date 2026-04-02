import Link from "next/link"
import {
  Shield,
  Award,
  Clock,
  Star,
  MapPin,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { BRAND } from "@/lib/constants"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'About Yumi Forever | Auto Detailing & Home Cleaning in NJ & NYC',
  description:
    'Learn about Yumi Forever, your trusted partner for premium auto detailing, home cleaning, and commercial services in New Jersey and New York City. Certified professionals, eco-friendly products, satisfaction guaranteed.',
  keywords: [
    'yumi forever', 'about yumi forever', 'cleaning company NJ',
    'auto detailing company NYC', 'professional cleaning NJ NYC',
    'cleaning company Secaucus', 'detailing company Hackensack',
    'cleaning company Jersey City', 'cleaning company Bergen County',
    'cleaning company Hudson County',
  ],
  openGraph: {
    title: 'About Yumi Forever | NJ & NYC Cleaning & Detailing',
    description:
      'Trusted auto detailing and home cleaning in NJ & NYC. Background-checked professionals, eco-friendly products, and 500+ services completed.',
  },
  alternates: { canonical: 'https://yumiforever.com/about' },
}

const VALUES = [
  {
    title: "Trusted Professionals",
    description:
      "Every team member is vetted, trained, and insured. We hold ourselves to the highest standards so you can have complete peace of mind.",
    icon: Shield,
  },
  {
    title: "Award-Winning Quality",
    description:
      "We use only professional-grade, eco-friendly products and proven techniques to deliver results that exceed expectations.",
    icon: Award,
  },
  {
    title: "Convenient Scheduling",
    description:
      "We come to you on your schedule. Book online in minutes and let our team handle the rest — at your home or wherever your vehicle is.",
    icon: Clock,
  },
  {
    title: "5-Star Experience",
    description:
      "We stand behind every service. If you are not completely satisfied with the results, we will make it right — guaranteed.",
    icon: Star,
  },
]

const STATS = [
  { value: "500+", label: "Services Completed" },
  { value: "4.9", label: "Average Rating" },
  { value: "50+", label: "Zip Codes Served" },
]

const SERVICE_AREA_HIGHLIGHTS = [
  "New York City (all five boroughs)",
  "Northern New Jersey",
  "Expanding to new areas regularly",
  "On-site service at your home or office",
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              About {BRAND.name}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              {BRAND.name} is your trusted partner for premium home care and
              auto detailing services. We bring professional-grade cleaning and
              detailing directly to your door — no drop-offs, no waiting rooms,
              no hassle.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Our Mission
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600">
                We believe every home deserves professional care and every
                vehicle deserves a showroom finish — delivered conveniently on
                your schedule, at your location.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                {BRAND.name} was built to deliver premium home cleaning and auto
                detailing without compromise. From a routine home clean to a
                full interior restoration on your vehicle, our certified teams
                bring the expertise, equipment, and top-tier products directly
                to you for consistent, exceptional results every time.
              </p>
            </div>
            <div className="mt-10 flex items-center justify-center lg:mt-0">
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="grid grid-cols-3 gap-8">
                  {STATS.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-4xl font-bold text-neutral-900">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-sm text-neutral-600">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              These principles guide everything we do, from hiring to the final
              detail.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <Card key={value.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                    <value.icon className="h-6 w-6 text-violet-700" />
                  </div>
                  <CardTitle className="mt-4 text-lg">{value.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {value.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-violet-700" />
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                  Service Area
                </h2>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-neutral-600">
                {BRAND.name} currently serves New York City and Northern New
                Jersey. We are continuously expanding to bring premium home and
                auto services to new neighborhoods.
              </p>
              <ul className="mt-8 space-y-3">
                {SERVICE_AREA_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-700" />
                    <span className="text-base text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-neutral-500">
                Not in our service area yet? Contact us — we may be able to
                accommodate your location or notify you when we expand.
              </p>
            </div>
            <div className="mt-10 flex items-center justify-center lg:mt-0">
              <div className="flex h-64 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white">
                <div className="text-center">
                  <MapPin className="mx-auto h-10 w-10 text-neutral-400" />
                  <p className="mt-3 text-sm text-neutral-500">
                    Interactive map coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Ready to experience premium service?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Join hundreds of satisfied customers who trust {BRAND.name} for
            their home cleaning and auto detailing needs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/services">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
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
