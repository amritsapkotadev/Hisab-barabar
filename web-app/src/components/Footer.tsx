import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-12">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-12">
        <div className="md:col-span-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 overflow-hidden rounded-lg block">
              <img src="/logo.jpeg" alt="Hisab Barabar logo" className="w-full h-full object-cover" />
            </span>
            <span className="font-semibold text-lg tracking-tight">Hisab Barabar</span>
          </Link>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 max-w-md leading-relaxed">
            Split expenses with friends without the awkward math. Track shared bills in groups, see who owes what at a glance, and settle up in seconds for weekend trips, dinners, or monthly rent.
          </p>
        </div>
        <nav className="md:col-span-3" aria-label="Product">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Product</h3>
          <ul className="space-y-2">
            <li><Link href="#features" className="hover:underline">Features</Link></li>
            <li><Link href="#how-it-works" className="hover:underline">How it works</Link></li>
            <li><Link href="#download" className="hover:underline">Download</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-3" aria-label="Company">
          <h3 className="text-sm font-medium text-neutral-500 mb-3">Company</h3>
          <ul className="space-y-2">
            <li><Link href="/about-us" className="hover:underline">About</Link></li>
            <li><Link href="/privacy-policy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/terms-of-service" className="hover:underline">Terms</Link></li>
            <li><Link href="/profile/delete-account" className="hover:underline">Delete account</Link></li>
          </ul>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between gap-2 text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Hisab Barabar.</p>
        <p>All rights reserved.</p>
      </div>
    </footer>
  )
}
