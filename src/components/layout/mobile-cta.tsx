"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Phone, X, Car, Sparkles, Building2, Truck, ArrowRight } from "lucide-react"
import { BRAND } from "@/lib/constants"

const SERVICE_OPTIONS = [
  { label: "Auto Care", icon: Car, href: "/book", color: "text-amber-500" },
  { label: "Home Care", icon: Sparkles, href: "/book/home", color: "text-blue-500" },
  { label: "Office & Commercial", icon: Building2, href: "/book/office", color: "text-violet-500" },
  { label: "Truck & Fleet", icon: Truck, href: "/contact", color: "text-emerald-500" },
]

export function MobileCTA() {
  const pathname = usePathname()
  const [showPicker, setShowPicker] = useState(false)

  // Hide on booking page (has its own CTA) and portal/dashboard pages
  const hidden = pathname.startsWith('/book') || pathname.startsWith('/portal') || pathname.startsWith('/crew') || pathname.startsWith('/admin') || pathname.startsWith('/dispatch')
  if (hidden) return null

  return (
    <>
      {/* Service picker overlay */}
      {showPicker && (
        <div className="fixed inset-0 z-[70] flex items-end md:hidden" onClick={() => setShowPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full rounded-t-2xl bg-white px-5 pb-8 pt-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Book a Service</h3>
              <button onClick={() => setShowPicker(false)} className="rounded-full p-1.5 text-neutral-400 active:bg-neutral-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {SERVICE_OPTIONS.map((opt) => (
                <Link
                  key={opt.label}
                  href={opt.href}
                  className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3.5 transition-colors active:bg-neutral-100"
                  onClick={() => setShowPicker(false)}
                >
                  <opt.icon className={`h-5 w-5 ${opt.color}`} />
                  <span className="flex-1 text-base font-medium text-neutral-900">{opt.label}</span>
                  <ArrowRight className="h-4 w-4 text-neutral-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden safe-bottom">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-violet-700 text-sm font-semibold text-white transition-colors active:bg-violet-800"
          >
            Book Now
          </button>
          <a
            href={`tel:${BRAND.phone}`}
            className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors active:bg-gray-50"
            aria-label="Call us"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </div>
    </>
  )
}
