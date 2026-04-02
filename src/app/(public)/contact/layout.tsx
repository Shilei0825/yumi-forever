import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Auto Detailing & Cleaning Services in NJ & NYC',
  description:
    'Contact Yumi Forever for auto detailing, home cleaning, office cleaning, and fleet services in New Jersey and NYC. Get a free quote, ask questions, or book a service. We respond within 24 hours.',
  openGraph: {
    title: 'Contact Yumi Forever | NJ & NYC',
    description:
      'Get in touch with Yumi Forever for auto detailing, home cleaning, and commercial services in NJ & NYC. Free quotes available.',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
