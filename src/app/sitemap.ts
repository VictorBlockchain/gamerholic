import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://gamerholic.fun'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: base + '/challenges', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/challenge', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: base + '/tournaments', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/tournament', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: base + '/team', lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/privacy', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: base + '/user-agreement', lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}