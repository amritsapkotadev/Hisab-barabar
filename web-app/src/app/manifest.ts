import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hisab Barabar',
    short_name: 'Hisab Barabar',
    description: 'Split bills and track shared expenses with friends and family.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/logo.jpeg',
        sizes: '1024x1024',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  }
}
