import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  Car,
  Truck,
  Shield,
  Award,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BRAND, MEMBERSHIP_PLANS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

const SERVICE_CATEGORIES = [
  {
    title: "Home Care",
    description:
      "Professional home cleaning, deep cleaning, and move-in/move-out services. We bring the sparkle to every corner.",
    icon: Sparkles,
    href: "/services/home-care",
  },
  {
    title: "Auto Care",
    description:
      "Hand wash, interior detailing, paint correction, and ceramic coating. Your vehicle deserves the best.",
    icon: Car,
    href: "/services/auto-care",
  },
  {
    title: "Office & Commercial",
    description:
      "Recurring office cleaning with flexible daily, weekly, or monthly plans. Keep your workspace spotless.",
    icon: Building2,
    href: "/services/office-commercial",
  },
  {
    title: "Truck & Fleet",
    description:
      "Commercial fleet washing, detailing, and recurring service contracts for businesses of all sizes.",
    icon: Truck,
    href: "/services/truck-fleet",
  },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Choose a Service",
    description: "Browse our home care, auto care, or fleet services and select what you need.",
  },
  {
    step: 2,
    title: "Book Online",
    description: "Pick a date, time, and location that works for you. Booking takes just minutes.",
  },
  {
    step: 3,
    title: "We Come to You",
    description: "Our certified professionals arrive at your door with all the tools and premium products.",
  },
  {
    step: 4,
    title: "Enjoy the Results",
    description: "Sit back and enjoy a spotless home or showroom-quality vehicle. Satisfaction guaranteed.",
  },
]

const WHY_YUMI = [
  {
    title: "Certified Professionals",
    description:
      "Every team member is background-checked, trained, and certified to deliver exceptional results.",
    icon: Shield,
  },
  {
    title: "Premium Products",
    description:
      "We use only eco-friendly, professional-grade products that are safe for your family and pets.",
    icon: Award,
  },
  {
    title: "Flexible Scheduling",
    description:
      "Book online 24/7. Choose the date and time that fits your schedule, including weekends.",
    icon: Clock,
  },
  {
    title: "Satisfaction Guaranteed",
    description:
      "Not happy? We will re-do the service at no extra charge. Your satisfaction is our priority.",
    icon: Star,
  },
]

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Homeowner",
    rating: 5,
    text: "Yumi Forever transformed my home! The deep cleaning team was thorough, professional, and left everything spotless. I have been a monthly member ever since.",
  },
  {
    name: "James T.",
    role: "Car Enthusiast",
    rating: 5,
    text: "The full detailing service is incredible. My car looks better than when I bought it. The ceramic coating was worth every penny. Highly recommend!",
  },
  {
    name: "Linda K.",
    role: "Property Manager",
    rating: 5,
    text: "Managing 200+ units means constant turnovers. Yumi Forever handles all our move-out cleanings with consistent quality and reliability. A true partner.",
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-dark overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            {/* Left: Text + CTAs */}
            <div>
              <Image
                src="/logo-vertical.png"
                alt={BRAND.name}
                width={280}
                height={280}
                className="mb-6 h-40 w-auto brightness-0 invert sm:h-52 lg:h-60"
                priority
              />
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl">
                {BRAND.tagline}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400 sm:mt-6 sm:text-lg sm:text-neutral-300">
                Professional home cleaning, auto detailing, office care, and fleet services — delivered to your door across NJ & NYC.
              </p>
              <div className="mt-8 flex gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <Button size="default" className="h-12 rounded-xl bg-white px-6 text-base font-semibold text-primary hover:bg-neutral-100 sm:h-11 sm:px-8 sm:rounded-md sm:text-sm" asChild>
                  <Link href="/book">
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button size="default" variant="outline" className="h-12 rounded-xl border-white/30 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10 sm:h-11 sm:px-8 sm:rounded-md sm:text-sm" asChild>
                  <Link href="/services">Our Services</Link>
                </Button>
              </div>

              {/* Service area badge */}
              <div className="mt-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/80">
                  <MapPin className="h-4 w-4" />
                  Serving the NJ & NYC Metro Area
                </span>
              </div>
            </div>

            {/* Right: Service photo collage */}
            <div className="mt-10 hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600&h=400&fit=crop"
                      alt="Professional hand washing a sports car with soap and sponge"
                      width={600}
                      height={400}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Auto Detailing</p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=600&h=400&fit=crop"
                      alt="Commercial fleet truck on highway"
                      width={600}
                      height={400}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Fleet Services</p>
                  </div>
                </div>
                <div className="space-y-3 pt-8">
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop"
                      alt="Professional home cleaning"
                      width={600}
                      height={400}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Home Cleaning</p>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl">
                    <Image
                      src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop"
                      alt="Office cleaning service"
                      width={600}
                      height={400}
                      className="h-48 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">Office Cleaning</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories — visible immediately on mobile */}
      <section className="bg-white py-12 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              What We Do
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-500 sm:mt-4 sm:text-lg sm:text-neutral-600">
              From homes to vehicles to entire fleets — premium care wherever you need it.
            </p>
          </div>

          {/* Mobile: clean cards */}
          <div className="mt-8 space-y-3 sm:hidden">
            {SERVICE_CATEGORIES.map((category) => (
              <Link
                key={category.title}
                href={category.title === 'Office & Commercial' ? '/services/office-commercial' : `/book?category=${category.title === 'Home Care' ? 'home_care' : category.title === 'Auto Care' ? 'auto_care' : 'truck_fleet'}`}
                className="flex items-center gap-4 rounded-2xl bg-neutral-50 p-4 transition-colors active:bg-neutral-100"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-neutral-900">{category.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1">{category.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-neutral-300" />
              </Link>
            ))}
          </div>

          {/* Desktop: full cards */}
          <div className="mt-16 hidden gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_CATEGORIES.map((category) => (
              <Card
                key={category.title}
                className="group relative overflow-hidden"
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-700">
                    <category.icon className="h-6 w-6 text-violet-700 transition-colors group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Link
                      href={category.href}
                      className="inline-flex items-center text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600"
                    >
                      Learn More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                    <Link
                      href={category.title === 'Office & Commercial' ? '/services/office-commercial' : `/book?category=${category.title === 'Home Care' ? 'home_care' : category.title === 'Auto Care' ? 'auto_care' : 'truck_fleet'}`}
                      className="inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Book Now
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-neutral-50 py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Getting started is simple. Premium service in four easy steps.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-700 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Yumi Forever */}
      <section className="bg-white py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Why {BRAND.name}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              We are committed to delivering an experience that goes beyond expectations.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_YUMI.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                  <feature.icon className="h-6 w-6 text-violet-700" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="bg-neutral-50 py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Membership Plans
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Save with a membership. Regular service, priority scheduling, and exclusive discounts.
            </p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {MEMBERSHIP_PLANS.map((plan, index) => (
              <Card
                key={plan.slug}
                className={
                  index === 2
                    ? "relative border-2 border-violet-700"
                    : ""
                }
              >
                {index === 2 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-700 px-4 py-1 text-xs font-semibold text-white">
                    Best Value
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-neutral-900">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-neutral-500">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                        <span className="text-sm text-neutral-600">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Button
                      className="w-full"
                      variant={index === 2 ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/book">Get Started</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
              Trusted by hundreds of homeowners, car enthusiasts, and businesses.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="flex flex-col">
                <CardHeader>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    &ldquo;{testimonial.text}&rdquo;
                  </p>
                  <div className="mt-6 border-t border-neutral-100 pt-4">
                    <p className="text-sm font-semibold text-neutral-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commercial CTA */}
      <section className="bg-neutral-50 py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-dark px-6 py-16 text-center sm:px-12 lg:px-20">
            <Building2 className="mx-auto h-10 w-10 text-neutral-400" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Commercial & Fleet Solutions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-300">
              Apartment complexes, dealerships, fleets, and commercial properties --
              we offer custom contracts and volume pricing to keep your business looking its best.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10"
                asChild
              >
                <Link href="/contact">
                  Get a Quote
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-14 pb-mobile-cta sm:py-24">
        <div className="mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Ready to experience premium service?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            Join hundreds of satisfied customers who trust {BRAND.name} for their home and auto care needs.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/book">
                Book Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
