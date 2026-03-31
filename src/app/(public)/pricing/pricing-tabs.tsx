"use client"

import Link from "next/link"
import { Car, Sparkles, Building2, Truck } from "lucide-react"

const TABS = [
  { id: "auto-care", label: "Auto Care", icon: Car },
  { id: "home-care", label: "Home Care", icon: Sparkles },
  { id: "office-commercial", label: "Office & Commercial", icon: Building2 },
  { id: "truck-fleet", label: "Truck & Fleet", icon: Truck },
]

export function PricingCategoryTabs() {
  return (
    <section className="sticky top-16 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-8 overflow-x-auto" aria-label="Pricing categories">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`#${tab.id}`}
              className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-1 py-4 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
