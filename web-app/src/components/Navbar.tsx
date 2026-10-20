'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all border-b ${
        scrolled
          ? 'bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-neutral-300 dark:border-neutral-800'
          : 'bg-white/70 dark:bg-neutral-950/70 backdrop-blur border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 overflow-hidden rounded-lg block">
              <img src="/logo.jpeg" alt="Hisab Barabar logo" className="w-full h-full object-cover" />
            </span>
            <span className="font-semibold tracking-tight text-lg">Hisab Barabar</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-[15px]">
            <Link href="/#features" className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              How it works
            </Link>
            <Link href="/#download" className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
              Download
            </Link>
            <ThemeToggle />
            <Link
              href="/#download"
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2 rounded-full font-medium hover:opacity-85 transition-opacity"
            >
              Get started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-950 border-t border-neutral-300 dark:border-neutral-800 animate-slideDown">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link href="/#features" className="block px-3 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg font-medium" onClick={() => setIsOpen(false)}>
              Features
            </Link>
            <Link href="/#how-it-works" className="block px-3 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg font-medium" onClick={() => setIsOpen(false)}>
              How it works
            </Link>
            <Link href="/#download" className="block mt-2 text-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-3 rounded-full font-medium" onClick={() => setIsOpen(false)}>
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
