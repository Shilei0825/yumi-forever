"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"

interface PriceAppealDialogProps {
  serviceSlug: string
  serviceName: string
  quotedPrice: number // in cents
}

type ContactPreference = "phone" | "text" | "email"

export function PriceAppealDialog({
  serviceSlug,
  serviceName,
  quotedPrice,
}: PriceAppealDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState("")

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [contactPreference, setContactPreference] =
    React.useState<ContactPreference>("phone")
  const [message, setMessage] = React.useState("")

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )

  function resetForm() {
    setName("")
    setEmail("")
    setPhone("")
    setContactPreference("phone")
    setMessage("")
    setFieldErrors({})
    setError("")
    setSubmitting(false)
    setSubmitted(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      // Reset form when dialog closes
      resetForm()
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = "Name is required"
    }

    if (!email.trim() && !phone.trim()) {
      errors.email = "At least an email or phone number is required"
      errors.phone = "At least an email or phone number is required"
    }

    if (contactPreference === "email" && !email.trim()) {
      errors.email = "Email is required for email contact preference"
    }

    if (
      (contactPreference === "phone" || contactPreference === "text") &&
      !phone.trim()
    ) {
      errors.phone = "Phone is required for phone/text contact preference"
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address"
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!validate()) return

    setSubmitting(true)

    try {
      const response = await fetch("/api/price-appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_slug: serviceSlug,
          service_name: serviceName,
          quoted_price: quotedPrice,
          customer_name: name.trim(),
          customer_email: email.trim() || undefined,
          customer_phone: phone.trim() || undefined,
          contact_preference: contactPreference,
          message: message.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit request")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const contactOptions: { value: ContactPreference; label: string }[] = [
    { value: "phone", label: "Phone Call" },
    { value: "text", label: "Text Message" },
    { value: "email", label: "Email" },
  ]

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-primary/30 text-primary hover:bg-violet-50 hover:text-primary"
      >
        Request Price Review
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogClose onClick={() => handleOpenChange(false)} />
          <DialogHeader>
            <DialogTitle>Request a Price Review</DialogTitle>
            <DialogDescription>
              {serviceName} &mdash; Currently{" "}
              {formatCurrency(quotedPrice)}
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Request Submitted
              </h3>
              <p className="mb-6 text-sm text-gray-600">
                Thank you! One of our technicians will review your request and
                contact you with a personalized quote.
              </p>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Think the price doesn&apos;t reflect your situation? Submit a
                request and one of our technicians will review your specific
                needs and contact you with a personalized quote.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name *"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fieldErrors.name}
                  disabled={submitting}
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  disabled={submitting}
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={fieldErrors.phone}
                  disabled={submitting}
                />

                <fieldset disabled={submitting}>
                  <legend className="mb-1.5 block text-sm font-medium text-gray-700">
                    Preferred Contact Method *
                  </legend>
                  <div className="flex gap-4">
                    {contactOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          name="contactPreference"
                          value={option.value}
                          checked={contactPreference === option.value}
                          onChange={() => setContactPreference(option.value)}
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Textarea
                  label="Message / Reason (optional)"
                  placeholder="Tell us about your specific situation or why you think the price should be different..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  disabled={submitting}
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
