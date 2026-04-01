import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yumi Forever',
    short_name: 'Yumi Forever',
    description:
      'Premium auto detailing, home cleaning, and commercial care services in NJ & NYC',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6d28d9',
  }
}
