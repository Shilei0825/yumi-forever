import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Yumi Forever | Premium On-Demand Home & Auto Services',
  description:
    'Professional home cleaning, car detailing, and fleet services delivered to your door. Book online in minutes.',
  keywords: [
    'car detailing',
    'home cleaning',
    'mobile car wash',
    'fleet services',
    'ceramic coating',
    'paint correction',
    'deep cleaning',
  ],
  openGraph: {
    title: 'Yumi Forever | Premium On-Demand Home & Auto Services',
    description:
      'Professional home cleaning, car detailing, and fleet services delivered to your door.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
