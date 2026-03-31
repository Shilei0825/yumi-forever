"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Briefcase,
  MapPin,
  Clock,
  Upload,
  CheckCircle2,
  ArrowRight,
  Car,
  Sparkles,
  Building2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BRAND } from "@/lib/constants"

const JOB_LISTINGS = [
  {
    id: "auto-detailing-tech",
    title: "Auto Detailing Technician",
    department: "Auto Care",
    icon: Car,
    type: "Full-Time",
    location: "NJ / NYC Metro Area",
    description:
      "Perform professional hand washes, interior detailing, paint correction, and ceramic coating on customer vehicles. Must have attention to detail and passion for cars.",
    requirements: [
      "1+ year auto detailing experience preferred",
      "Valid driver's license",
      "Ability to lift 30+ lbs",
      "Reliable transportation",
      "Professional appearance and attitude",
    ],
  },
  {
    id: "auto-detailing-supervisor",
    title: "Auto Detailing Supervisor",
    department: "Auto Care",
    icon: Car,
    type: "Full-Time",
    location: "NJ / NYC Metro Area",
    description:
      "Lead and train a team of detailing technicians. Ensure quality standards, manage scheduling, and oversee daily operations at mobile detailing sites.",
    requirements: [
      "3+ years auto detailing experience",
      "1+ year supervisory experience",
      "Strong leadership and communication skills",
      "Valid driver's license",
      "Quality control mindset",
    ],
  },
  {
    id: "home-commercial-cleaner",
    title: "Home / Commercial Cleaner",
    department: "Cleaning Services",
    icon: Sparkles,
    type: "Full-Time / Part-Time",
    location: "NJ / NYC Metro Area",
    description:
      "Provide professional cleaning services for residential homes and commercial offices. Maintain high standards of cleanliness and customer satisfaction.",
    requirements: [
      "Previous cleaning experience preferred",
      "Reliable transportation",
      "Ability to work independently and in teams",
      "Attention to detail",
      "Flexible schedule availability",
    ],
  },
  {
    id: "cleaning-supervisor",
    title: "Cleaning Supervisor",
    department: "Cleaning Services",
    icon: Building2,
    type: "Full-Time",
    location: "NJ / NYC Metro Area",
    description:
      "Supervise cleaning crews across residential and commercial accounts. Conduct quality inspections, train new staff, and manage client relationships.",
    requirements: [
      "3+ years professional cleaning experience",
      "1+ year supervisory or team lead experience",
      "Strong organizational and communication skills",
      "Valid driver's license",
      "Bilingual (English/Spanish) a plus",
    ],
  },
]

export default function CareersPage() {
  const [selectedPosition, setSelectedPosition] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    experience: "",
    message: "",
    agreedToEEO: false,
  })
  const [resume, setResume] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedPosition) {
      setError("Please select a position.")
      return
    }
    if (!resume) {
      setError("Please upload your resume.")
      return
    }
    if (!formData.agreedToEEO) {
      setError("Please acknowledge the Equal Employment Opportunity statement.")
      return
    }

    setSubmitting(true)

    try {
      const data = new FormData()
      data.append("firstName", formData.firstName)
      data.append("lastName", formData.lastName)
      data.append("email", formData.email)
      data.append("phone", formData.phone)
      data.append("position", selectedPosition)
      data.append("experience", formData.experience)
      data.append("message", formData.message)
      data.append("agreedToEEO", String(formData.agreedToEEO))
      data.append("resume", resume)

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: data,
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || "Failed to submit application")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Application Submitted
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Thank you for your interest in joining {BRAND.name}. We have received your
            application and will review it shortly. If your qualifications match our needs,
            we will be in touch.
          </p>
          <div className="mt-10">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-dark py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Join Our Team
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-neutral-300">
              {BRAND.name} is growing and we are looking for talented, reliable
              people to join our crew. We offer competitive pay, flexible schedules,
              and a great team environment.
            </p>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="bg-neutral-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Competitive Pay", desc: "Above-market wages with performance bonuses" },
              { title: "Flexible Hours", desc: "Full-time and part-time positions available" },
              { title: "Growth Opportunities", desc: "Advance from technician to supervisor and beyond" },
              { title: "Great Team", desc: "Work with a supportive, professional crew" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-base font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Open Positions
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Select a position below to apply. All positions are based in the NJ / NYC metro area.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {JOB_LISTINGS.map((job) => (
              <div
                key={job.id}
                className={`rounded-lg border p-6 transition-colors cursor-pointer ${
                  selectedPosition === job.title
                    ? "border-violet-700 bg-violet-50/50 ring-1 ring-violet-700/20"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
                onClick={() => {
                  setSelectedPosition(job.title)
                  // Scroll to the application form
                  setTimeout(() => {
                    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })
                  }, 100)
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <job.icon className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">{job.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600">{job.description}</p>
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Requirements</p>
                      <ul className="mt-2 space-y-1">
                        {job.requirements.map((req) => (
                          <li key={req} className="flex items-start gap-2 text-sm text-neutral-600">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="scroll-mt-20 bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Apply Now
          </h2>
          <p className="mt-4 text-neutral-600">
            {selectedPosition
              ? `Applying for: ${selectedPosition}`
              : "Select a position above, then fill out the form below."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                  Phone *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-neutral-700">
                Position *
              </label>
              <select
                id="position"
                required
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Select a position</option>
                {JOB_LISTINGS.map((job) => (
                  <option key={job.id} value={job.title}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-neutral-700">
                Years of Experience
              </label>
              <select
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="">Select</option>
                <option value="0-1">Less than 1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5+">5+ years</option>
              </select>
            </div>

            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Resume / CV *
              </label>
              <div className="mt-1">
                <label
                  htmlFor="resume"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-300 px-6 py-8 transition-colors hover:border-violet-400"
                >
                  <Upload className="h-5 w-5 text-neutral-400" />
                  <span className="text-sm text-neutral-600">
                    {resume ? resume.name : "Click to upload PDF, DOC, or DOCX (max 5MB)"}
                  </span>
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setResume(file)
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
                Additional Information
              </label>
              <textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about yourself, your availability, or anything else you'd like us to know."
                className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* EEO Statement */}
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">
                Equal Employment Opportunity Statement
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                {BRAND.name} is an Equal Opportunity Employer. We are committed to
                providing a workplace free from discrimination and harassment. All
                qualified applicants will receive consideration for employment without
                regard to race, color, religion, sex, sexual orientation, gender identity,
                national origin, disability, veteran status, or any other protected
                characteristic as outlined by federal, state, or local laws. We celebrate
                diversity and are dedicated to creating an inclusive environment for all
                employees.
              </p>
              <div className="mt-3 flex items-start gap-2">
                <input
                  id="eeo"
                  type="checkbox"
                  checked={formData.agreedToEEO}
                  onChange={(e) => setFormData({ ...formData, agreedToEEO: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="eeo" className="text-sm text-neutral-700">
                  I acknowledge that I have read and understand the Equal Employment
                  Opportunity statement above. *
                </label>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
              {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        </div>
      </section>
    </>
  )
}
