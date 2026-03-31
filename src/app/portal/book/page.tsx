import Link from 'next/link'
import {
  Car,
  Sparkles,
  Building2,
  Truck,
  ArrowRight,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: `Book a Service | ${BRAND.name}`,
  description: 'Choose a service category to book your next appointment.',
}

const SERVICE_CATEGORIES = [
  {
    title: 'Auto Care',
    description:
      'Premium mobile detailing delivered to your driveway. Hand washes, interior detailing, paint correction, ceramic coating, and more.',
    icon: Car,
    href: '/book',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
  },
  {
    title: 'Home Care',
    description:
      'Professional cleaning services for homes and apartments. From routine cleaning to deep sanitization.',
    icon: Sparkles,
    href: '/book/home',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
  },
  {
    title: 'Office & Commercial',
    description:
      'Recurring professional office cleaning with flexible daily, weekly, or monthly plans for businesses of all sizes.',
    icon: Building2,
    href: '/book/office',
    color: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderHover: 'hover:border-violet-300',
  },
  {
    title: 'Truck & Fleet',
    description:
      'Commercial-grade washing and detailing for fleets of any size. Custom contracts and on-site service.',
    icon: Truck,
    href: '/contact',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
  },
]

export default function PortalBookPage() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Book a Service
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose a service category to get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SERVICE_CATEGORIES.map((category) => (
          <Link
            key={category.title}
            href={category.href}
            className={`group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 transition-all ${category.borderHover}`}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${category.color}`}
            >
              <category.icon className={`h-6 w-6 ${category.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-gray-900">
                {category.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {category.description}
              </p>
            </div>
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  )
}
