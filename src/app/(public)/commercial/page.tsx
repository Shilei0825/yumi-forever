"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Building2,
  Car,
  Truck,
  Home,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BRAND } from "@/lib/constants"
import { cn } from "@/lib/utils"

const quoteSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  serviceType: z.string().min(1, "Please select a service type"),
  message: z.string().min(10, "Please describe your needs in at least 10 characters"),
})

type QuoteFormData = z.infer<typeof quoteSchema>

const SEGMENTS = [
  {
    title: "Apartment Communities",
    description:
      "Resident car wash programs, common area cleaning, move-out cleans, and amenity maintenance for property managers.",
    icon: Home,
    href: "/contact",
    features: [
      "Resident detailing programs",
      "Common area cleaning",
      "Move-in/move-out cleaning",
      "Amenity space maintenance",
    ],
  },
  {
    title: "Car Dealerships",
    description:
      "Lot wash, delivery prep, pre-owned reconditioning, and showroom detailing to keep your inventory looking its best.",
    icon: Car,
    href: "/contact",
    features: [
      "Daily lot wash programs",
      "Delivery detail prep",
      "Pre-owned reconditioning",
      "Showroom cleaning",
    ],
  },
  {
    title: "Fleet Operations",
    description:
      "Scheduled washing and detailing for commercial fleets. Keep vehicles clean, branded, and road-ready.",
    icon: Truck,
    href: "/services/truck-fleet",
    features: [
      "On-site fleet washing",
      "Scheduled recurring service",
      "Vehicle branding care",
      "DOT compliance cleaning",
    ],
  },
  {
    title: "Commercial Properties",
    description:
      "Office buildings, retail centers, medical facilities, and more. Professional cleaning tailored to your property.",
    icon: Building2,
    href: "/services/office-commercial",
    features: [
      "Office and lobby cleaning",
      "Retail space maintenance",
      "Post-construction cleanup",
      "Restroom sanitization",
    ],
  },
]

const SERVICE_TYPE_OPTIONS = [
  { value: "", label: "Select a service type" },
  { value: "apartment", label: "Apartment Community" },
  { value: "dealership", label: "Car Dealership" },
  { value: "fleet", label: "Fleet Operations" },
  { value: "commercial", label: "Commercial Property" },
  { value: "other", label: "Other" },
]

export default function CommercialPage() {
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
  })

  async function onSubmit(data: QuoteFormData) {
    setSubmitStatus("loading")
    try {
      const response = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to submit")
      }

      setSubmitStatus("success")
      reset()
    } catch {
      setSubmitStatus("error")
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-sm font-medium uppercase tracking-wider text-neutral-400">
              Commercial Solutions
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Tailored Services for Your Business
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              From apartment communities to dealerships and fleets, {BRAND.name} provides
              custom cleaning and detailing contracts that scale with your business.
            </p>
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Solutions for Every Industry
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              We work with businesses across multiple industries, delivering customized
              service plans that meet your unique needs.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {SEGMENTS.map((segment) => (
              <Card key={segment.title}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                    <segment.icon className="h-6 w-6 text-violet-700" />
                  </div>
                  <CardTitle className="mt-4 text-xl">{segment.title}</CardTitle>
                  <CardDescription className="text-base">
                    {segment.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {segment.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-700" />
                        <span className="text-sm text-neutral-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="mt-6 w-full" asChild>
                    <Link href={segment.href}>
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote-form" className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Left: Info */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Request a Quote
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                Tell us about your business and service needs. Our commercial team will
                prepare a custom proposal within 24 hours.
              </p>
              <div className="mt-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Submit Your Request
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Fill out the form with your business details and service needs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      We Review & Consult
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Our team reviews your needs and may schedule a brief call or site visit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Receive Your Proposal
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Get a detailed, no-obligation quote tailored to your business.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="mt-12 lg:mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Get a Free Quote</CardTitle>
                  <CardDescription>
                    All fields are required. We will respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitStatus === "success" ? (
                    <div className="py-8 text-center">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                      <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                        Quote Request Submitted
                      </h3>
                      <p className="mt-2 text-sm text-neutral-600">
                        Thank you! Our commercial team will be in touch within 24 hours.
                      </p>
                      <Button
                        className="mt-6"
                        variant="outline"
                        onClick={() => setSubmitStatus("idle")}
                      >
                        Submit Another Request
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <Input
                        label="Full Name"
                        placeholder="John Smith"
                        error={errors.name?.message}
                        {...register("name")}
                      />

                      <Input
                        label="Email"
                        type="email"
                        placeholder="john@company.com"
                        error={errors.email?.message}
                        {...register("email")}
                      />

                      <Input
                        label="Phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        error={errors.phone?.message}
                        {...register("phone")}
                      />

                      <Input
                        label="Company Name"
                        placeholder="Acme Properties LLC"
                        error={errors.company?.message}
                        {...register("company")}
                      />

                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Service Type
                        </label>
                        <select
                          className={cn(
                            "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                            errors.serviceType && "border-red-500 focus-visible:ring-red-500"
                          )}
                          {...register("serviceType")}
                        >
                          {SERVICE_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errors.serviceType && (
                          <p className="mt-1.5 text-sm text-red-600">
                            {errors.serviceType.message}
                          </p>
                        )}
                      </div>

                      <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Tell Us About Your Needs
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe your property, fleet size, desired service frequency, and any special requirements..."
                          className={cn(
                            "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                            errors.message && "border-red-500 focus-visible:ring-red-500"
                          )}
                          {...register("message")}
                        />
                        {errors.message && (
                          <p className="mt-1.5 text-sm text-red-600">
                            {errors.message.message}
                          </p>
                        )}
                      </div>

                      {submitStatus === "error" && (
                        <div className="rounded-md bg-red-50 p-3">
                          <p className="text-sm text-red-700">
                            Something went wrong. Please try again or call us at{" "}
                            {BRAND.phone}.
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={submitStatus === "loading"}
                      >
                        {submitStatus === "loading" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Quote Request
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Prefer to talk to someone?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Our commercial team is ready to discuss your needs. Give us a call or send an email.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="outline" asChild>
              <a href={`tel:${BRAND.phone}`}>{BRAND.phone}</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
