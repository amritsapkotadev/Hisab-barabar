import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hisab Barabar - Split Bills & Track Expenses',
  description: 'Split bills easily with friends and family. Track expenses, settle up, and keep your finances organized.',
  keywords: ['expense tracker', 'bill splitting', 'shared expenses', 'split bills', 'group expenses'],
  authors: [{ name: 'Hisab Barabar Team' }],
  icons: {
    icon: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  openGraph: {
    title: 'Hisab Barabar - Split Bills & Track Expenses',
    description: 'Split bills easily with friends and family. Track expenses, settle up, and keep your finances organized.',
    type: 'website',
    images: ['/logo.jpeg'],
  },
}

const themeInit = `(function(){try{var t=localStorage.getItem('hb-theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
