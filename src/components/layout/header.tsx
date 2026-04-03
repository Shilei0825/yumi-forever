"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { Menu, X, Phone, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Commercial", href: "/services/office-commercial" },
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])

  // Check auth state on mount and subscribe to changes
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full border-b border-gray-200/80 transition-colors",
        mobileMenuOpen
          ? "bg-white"
          : "bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80"
      )}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/logo-horizontal.png" alt={BRAND.name} width={1536} height={1024} className="h-16 w-auto sm:h-20" priority />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900",
                  pathname === link.href
                    ? "text-gray-900"
                    : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href={`tel:${BRAND.phone}`}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden lg:inline">{BRAND.phone}</span>
            </a>
            {isLoggedIn ? (
              <Link
                href="/portal"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-[#2A2A2A] transition-colors hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Customer Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-[#2A2A2A] transition-colors hover:bg-gray-50"
              >
                Login
              </Link>
            )}
            <Link
              href="/services"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-violet-600"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile: Sign In + Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn ? (
              <Link
                href="/portal"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors active:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu — rendered via portal to avoid header bg-white/80 inheritance */}
      {mounted && createPortal(
        <div
          className={cn(
            "fixed inset-0 top-20 z-[60] bg-white transition-all duration-300 ease-in-out md:hidden",
            mobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "pointer-events-none opacity-0 -translate-y-2"
          )}
        >
          <div className="flex h-[calc(100vh-5rem)] flex-col overflow-y-auto bg-white">
            <nav className="flex-1 px-6 py-8">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "block rounded-xl px-4 py-3.5 text-lg font-medium transition-colors active:bg-gray-100",
                      pathname === link.href
                        ? "text-primary"
                        : "text-gray-900"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="border-t border-gray-100 bg-white px-6 py-6 safe-bottom">
              <a
                href={`tel:${BRAND.phone}`}
                className="mb-5 flex items-center gap-2.5 text-base font-medium text-gray-500"
              >
                <Phone className="h-5 w-5" />
                {BRAND.phone}
              </a>
              <div className="flex flex-col gap-3">
                <Link
                  href="/services"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors active:bg-violet-600"
                >
                  Book Now
                </Link>
                {isLoggedIn ? (
                  <Link
                    href="/portal"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-base font-semibold text-gray-900 transition-colors active:bg-gray-50"
                  >
                    <User className="h-5 w-5" />
                    Customer Portal
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-base font-semibold text-gray-900 transition-colors active:bg-gray-50"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
