import type { MetadataRoute } from 'next'

const BASE_URL = 'https://hisabbarabar.qzz.io'

const routes: Array<{ path: string; priority: number }> = [
  { path: '', priority: 1 },
  { path: '/about-us', priority: 0.6 },
  { path: '/privacy-policy', priority: 0.4 },
  { path: '/terms-of-service', priority: 0.4 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: 'monthly',
    priority,
  }))
}
