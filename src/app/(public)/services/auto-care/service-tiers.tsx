"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Zap, Crown, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { SERVICES, VEHICLE_TYPES } from "@/lib/constants"
import type { ServiceTier } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"

const TIER_CONFIG: {
  key: ServiceTier
  label: string
  summary: string
  icon: typeof Zap
  iconBg: string
  iconColor: string
  borderColor: string
  hoverBg: string
}[] = [
  {
    key: "express",
    label: "Express Services",
    summary: "Quick, professional care in under an hour",
    icon: Zap,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    hoverBg: "hover:bg-amber-50/50",
  },
  {
    key: "premium",
    label: "Premium Services",
    summary: "Deep cleaning and restoration for a showroom finish",
    icon: Crown,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200",
    hoverBg: "hover:bg-violet-50/50",
  },
]

export default function ServiceTiers() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(tier: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(tier)) {
        next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Our Auto Care Services
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600">
          Every service is performed by trained professionals using premium
          products that protect your vehicle&apos;s finish.
        </p>

        <div className="mt-12 space-y-6">
          {TIER_CONFIG.map((tier) => {
            const isExpanded = expanded.has(tier.key)
            const services = SERVICES.filter((s) => s.tier === tier.key)
            const Icon = tier.icon

            return (
              <div key={tier.key}>
                {/* Tier toggle button */}
                <button
                  type="button"
                  onClick={() => toggle(tier.key)}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-xl border transition-colors",
                    tier.borderColor,
                    tier.hoverBg
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        tier.iconBg
                      )}
                    >
                      <Icon className={cn("h-5 w-5", tier.iconColor)} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {tier.label}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {tier.summary}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-neutral-400 transition-transform duration-300",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Collapsible service cards */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="pt-6 grid gap-6 lg:grid-cols-2">
                      {services.map((service) => (
                        <Card
                          key={service.slug}
                          className={cn(
                            "flex flex-col",
                            service.popular &&
                              "border-primary/30 ring-1 ring-primary/10"
                          )}
                        >
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/services/${service.slug}`}
                                className="hover:underline"
                              >
                                <CardTitle className="text-xl">
                                  {service.name}
                                </CardTitle>
                              </Link>
                              {service.popular && (
                                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                                  Most Popular
                                </span>
                              )}
                            </div>
                            <CardDescription className="mt-2 text-base">
                              {service.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-1 flex-col justify-end">
                            <div className="space-y-2 border-t border-neutral-100 pt-4">
                              {VEHICLE_TYPES.map((vt) => (
                                <div
                                  key={vt.key}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-neutral-600">
                                    {vt.label}
                                  </span>
                                  <span className="font-semibold text-neutral-900">
                                    {formatCurrency(service.pricing[vt.key])}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />~{service.duration}{" "}
                                min
                              </span>
                              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                                Deposit:{" "}
                                {formatCurrency(service.depositAmount)}
                              </span>
                            </div>
                            <div className="mt-6 flex gap-3">
                              <Button
                                variant="outline"
                                className="flex-1"
                                asChild
                              >
                                <Link href={`/services/${service.slug}`}>
                                  Details
                                </Link>
                              </Button>
                              <Button className="flex-1" asChild>
                                <Link href={`/book?service=${service.slug}`}>
                                  Book Now
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
