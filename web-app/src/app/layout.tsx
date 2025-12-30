import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hisab Barabar - Split Bills & Track Expenses',
  description: 'Split bills easily with friends and family. Track expenses, settle up, and keep your finances organized.',
  keywords: ['expense tracker', 'bill splitting', 'shared expenses', 'split bills', 'group expenses'],
  authors: [{ name: 'Hisab Barabar Team' }],
  openGraph: {
    title: 'Hisab Barabar - Split Bills & Track Expenses',
    description: 'Split bills easily with friends and family. Track expenses, settle up, and keep your finances organized.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
