"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
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

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

const CONTACT_INFO = [
  {
    title: "Phone",
    value: BRAND.phone,
    description: "Mon-Sat, 8am-6pm",
    icon: Phone,
    href: `tel:${BRAND.phone}`,
  },
  {
    title: "Email",
    value: BRAND.email,
    description: "We respond within 24 hours",
    icon: Mail,
    href: `mailto:${BRAND.email}`,
  },
  {
    title: "Service Area",
    value: BRAND.address,
    description: "80+ zip codes covered",
    icon: MapPin,
    href: null,
  },
  {
    title: "Business Hours",
    value: "Mon - Sat: 8:00 AM - 6:00 PM",
    description: "Sunday by appointment only",
    icon: Clock,
    href: null,
  },
]

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(data: ContactFormData) {
    setSubmitStatus("loading")
    try {
      const response = await fetch("/api/contact", {
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              Have a question, need a quote, or want to learn more about our services?
              We are here to help. Reach out by phone, email, or the form below.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_INFO.map((item) => (
              <Card key={item.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                    <item.icon className="h-6 w-6 text-violet-700" />
                  </div>
                  <CardTitle className="mt-4 text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-neutral-900">
                      {item.value}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section className="bg-neutral-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Send Us a Message
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Fill out the form below and we will get back to you as soon as possible.
              </p>

              <div className="mt-10">
                <Card>
                  <CardContent className="pt-6">
                    {submitStatus === "success" ? (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                        <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                          Message Sent
                        </h3>
                        <p className="mt-2 text-sm text-neutral-600">
                          Thank you for reaching out! We will respond within 24 hours.
                        </p>
                        <Button
                          className="mt-6"
                          variant="outline"
                          onClick={() => setSubmitStatus("idle")}
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                          label="Full Name"
                          placeholder="Jane Doe"
                          error={errors.name?.message}
                          {...register("name")}
                        />

                        <Input
                          label="Email"
                          type="email"
                          placeholder="jane@example.com"
                          error={errors.email?.message}
                          {...register("email")}
                        />

                        <Input
                          label="Phone (optional)"
                          type="tel"
                          placeholder="(555) 123-4567"
                          error={errors.phone?.message}
                          {...register("phone")}
                        />

                        <div className="w-full">
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">
                            Message
                          </label>
                          <textarea
                            rows={5}
                            placeholder="How can we help you?"
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
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
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

            {/* Map Placeholder */}
            <div className="mt-12 lg:mt-0">
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Our Service Area
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                We serve the greater metro area with mobile home cleaning and auto detailing
                services delivered directly to you.
              </p>
              <div className="mt-10 flex h-80 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 lg:h-96">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-neutral-400" />
                  <p className="mt-4 text-sm font-medium text-neutral-500">
                    Interactive map coming soon
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {BRAND.address}
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
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Skip the form and book a service directly. It takes less than 2 minutes.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <a href="/book">
                Book a Service
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
