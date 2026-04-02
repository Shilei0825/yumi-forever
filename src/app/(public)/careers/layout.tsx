import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers | Join Our Team at Yumi Forever | NJ & NYC Jobs',
  description:
    'Join the Yumi Forever team. We are hiring auto detailing technicians, home cleaners, cleaning supervisors, and more in New Jersey and NYC. Competitive pay, flexible hours, growth opportunities. Apply today.',
  keywords: [
    'auto detailing jobs NJ',
    'cleaning jobs NYC',
    'car detailing careers',
    'home cleaning jobs New Jersey',
    'cleaning supervisor jobs',
    'yumi forever careers',
    'detailing technician jobs near me',
    'cleaning jobs Secaucus', 'detailing jobs Hackensack',
    'cleaning jobs Jersey City', 'cleaning jobs Bergen County',
  ],
  openGraph: {
    title: 'Careers at Yumi Forever | NJ & NYC',
    description:
      'Join our growing team. Auto detailing, home cleaning, and commercial cleaning positions available in NJ & NYC. Apply online today.',
  },
}

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
