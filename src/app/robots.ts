import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/crew', '/dispatch', '/portal', '/api/'],
    },
    sitemap: 'https://yumiforever.com/sitemap.xml',
  }
}
