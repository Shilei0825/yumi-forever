import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yumiforever.com'),
  title: {
    default: 'Yumi Forever | Auto Detailing, Home Cleaning & Office Care | NJ & NYC',
    template: '%s | Yumi Forever',
  },
  description:
    'Yumi Forever provides premium auto detailing, home cleaning, office cleaning, and fleet washing services across New Jersey and New York City. Mobile car wash, ceramic coating, deep cleaning, and more. Book online today.',
  keywords: [
    'auto detailing NJ',
    'car detailing near me',
    'mobile car wash NJ',
    'home cleaning NJ',
    'house cleaning New Jersey',
    'office cleaning NYC',
    'commercial cleaning NJ',
    'fleet washing service',
    'ceramic coating NJ',
    'paint correction NJ',
    'deep cleaning NJ',
    'move out cleaning NJ',
    'car detailing NYC',
    'interior detailing NJ',
    'truck fleet washing',
    'yumi forever',
    'mobile detailing NJ',
    'professional cleaning service NJ NYC',
  ],
  openGraph: {
    title: 'Yumi Forever | Auto Detailing, Home Cleaning & Office Care | NJ & NYC',
    description:
      'Premium mobile auto detailing, professional home cleaning, office care, and fleet washing services serving New Jersey and NYC. Book online in minutes.',
    type: 'website',
    url: 'https://yumiforever.com',
    siteName: 'Yumi Forever',
    locale: 'en_US',
    images: [
      {
        url: 'https://yumiforever.com/logo-horizontal.png',
        width: 1536,
        height: 1024,
        alt: 'Yumi Forever - Premium Cleaning & Detailing Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yumi Forever | Auto Detailing, Home Cleaning & Office Care | NJ & NYC',
    description:
      'Premium mobile auto detailing, professional home cleaning, office care, and fleet washing services serving NJ & NYC.',
    images: ['https://yumiforever.com/logo-horizontal.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '64x64' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: 'https://yumiforever.com',
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
