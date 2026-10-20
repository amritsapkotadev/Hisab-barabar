'use client'

import React, { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.message || 'Failed to request account deletion.')
      }
    } catch {
      setError('Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
          <h1 className="text-2xl font-semibold tracking-tight mb-3">Delete your account</h1>
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
            If you wish to permanently delete your account and all associated data, please enter your email address below. This action is irreversible.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-3 text-sm font-medium">
              Your account deletion request has been submitted. We will process your request as soon as possible.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-transparent border border-neutral-300 dark:border-neutral-800 rounded-xl px-4 py-2.5 outline-none focus:border-neutral-900 dark:focus:border-white transition-colors mb-4"
              />
              {error && <div className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-full font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Request account deletion'}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-neutral-500">
            For any questions, contact our support team.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}
