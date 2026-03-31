import Link from "next/link"
import Image from "next/image"
import { BRAND } from "@/lib/constants"

const FOOTER_LINKS = {
  company: {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  services: {
    title: "Services",
    links: [
      { label: "Home Care", href: "/services/home-care" },
      { label: "Auto Care", href: "/services/auto-care" },
      { label: "Fleet", href: "/services/truck-fleet" },
      { label: "Commercial", href: "/services/office-commercial" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="bg-dark text-white pb-mobile-cta">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Top Section: Logo + Tagline */}
        <div className="mb-10 border-b border-white/10 pb-10">
          <Link href="/" className="inline-block">
            <Image src="/logo-horizontal.png" alt={BRAND.name} width={200} height={54} className="h-14 w-auto brightness-0 invert" />
          </Link>
          <p className="mt-3 max-w-md text-sm text-neutral-400">
            {BRAND.tagline}
          </p>
        </div>

        {/* Link Columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              {FOOTER_LINKS.company.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.company.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              {FOOTER_LINKS.services.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.services.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              {FOOTER_LINKS.support.title}
            </h3>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.support.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href={`tel:${BRAND.phone}`}
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {BRAND.email}
                </a>
              </li>
              <li>
                <p className="text-sm text-neutral-400">
                  {BRAND.address}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
