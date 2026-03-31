"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Phone } from "lucide-react"
import { BRAND } from "@/lib/constants"

export function MobileCTA() {
  const pathname = usePathname()

  // Hide on booking page (has its own CTA) and portal/dashboard pages
  const hidden = pathname.startsWith('/book') || pathname.startsWith('/portal') || pathname.startsWith('/crew') || pathname.startsWith('/admin') || pathname.startsWith('/dispatch')
  if (hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden safe-bottom">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/book"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-violet-700 text-sm font-semibold text-white transition-colors active:bg-violet-800"
        >
          Book Now
        </Link>
        <a
          href={`tel:${BRAND.phone}`}
          className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors active:bg-gray-50"
          aria-label="Call us"
        >
          <Phone className="h-5 w-5" />
        </a>
      </div>
    </div>
  )
}
