'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { FaUsers, FaChartPie, FaBalanceScale, FaExchangeAlt, FaWallet, FaBell, FaReceipt, FaCalculator, FaQrcode, FaUserPlus, FaMoneyBill, FaPercent, FaShareAlt, FaCoins, FaPiggyBank, FaEnvelope, FaMobileAlt, FaClock } from 'react-icons/fa'
import type { IconType } from 'react-icons'

// Pool of related ghost icons; each card samples a different trio (deterministic by index)
const DECOR: IconType[] = [FaReceipt, FaCalculator, FaQrcode, FaUserPlus, FaMoneyBill, FaPercent, FaShareAlt, FaCoins, FaPiggyBank, FaEnvelope, FaMobileAlt, FaClock]

const features: { title: string; body: string; icon: IconType }[] = [
  {
    title: 'True-to-life groups',
    body: 'Trips, flats, family. Invite by code or QR without breaking history.',
    icon: FaUsers,
  },
  {
    title: 'Any split shape',
    body: 'Equal, unequal, percentage, or shares, with more than one payer per bill.',
    icon: FaChartPie,
  },
  {
    title: 'Balances at a glance',
    body: 'Who gets back and who owes, per friend and per group.',
    icon: FaBalanceScale,
  },
  {
    title: 'Fewest payments',
    body: 'An optimizer finds the shortest path to zero and logs every settle.',
    icon: FaExchangeAlt,
  },
  {
    title: 'Budgets that warn',
    body: 'A monthly cap with a nudge before you cross it.',
    icon: FaWallet,
  },
  {
    title: 'Quiet reminders',
    body: 'Push and email when an expense lands or a settle completes.',
    icon: FaBell,
  },
]

const AUTOPLAY_MS = 4500

function deckStyle(offset: number): { className: string; active: boolean } {
  switch (offset) {
    case 0:
      return { className: 'opacity-100 scale-100 rotate-0 blur-0 z-20', active: true }
    case 1:
      return { className: 'translate-x-3 sm:translate-x-5 translate-y-3 scale-[0.96] rotate-[2deg] opacity-95 blur-[1px] z-10', active: false }
    case 2:
      return { className: 'translate-x-6 sm:translate-x-10 translate-y-6 scale-[0.92] rotate-[4deg] opacity-65 blur-[2.5px] z-0', active: false }
    default:
      return { className: 'translate-x-8 translate-y-8 scale-90 opacity-0 blur-sm pointer-events-none z-0', active: false }
  }
}

export default function Features() {
  const pauseRef = useRef(false)
  const [active, setActive] = useState(0)

  const goTo = useCallback((index: number) => {
    setActive((index + features.length) % features.length)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (pauseRef.current || document.hidden) return
      setActive((prev) => (prev + 1) % features.length)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [pauseRef])

  return (
    <section id="features" className="p-5 sm:p-8 w-full min-w-0">
      <div className="grid gap-5 sm:gap-6 min-w-0">
        <div className="flex items-start justify-between gap-4 min-w-0">
          <div className="text-left min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Features</h2>
          </div>
          <div className="flex gap-2 pt-2 shrink-0" role="tablist" aria-label="Feature slides">
            {features.map((f, i) => (
              <button
                key={f.title}
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to ${f.title}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active ? 'w-6 bg-neutral-900 dark:bg-white' : 'w-2 bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div
          onMouseEnter={() => (pauseRef.current = true)}
          onMouseLeave={() => (pauseRef.current = false)}
          onFocus={() => (pauseRef.current = true)}
          onBlur={() => (pauseRef.current = false)}
          className="min-w-0"
        >
          <div className="relative min-h-[320px] sm:min-h-[360px]" style={{ perspective: '1200px' }}>
            {features.map((f, i) => {
              const offset = (i - active + features.length) % features.length
              const { className, active: isFront } = deckStyle(offset)
              const D2 = DECOR[(i * 3 + 5) % DECOR.length]
              const D3 = DECOR[(i * 3 + 9) % DECOR.length]
              return (
                <article
                  key={f.title}
                  aria-label={`${i + 1} of ${features.length}: ${f.title}`}
                  aria-hidden={!isFront}
                  onClick={() => {
                    if (!isFront) goTo(i)
                  }}
                  className={`absolute inset-0 border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] px-5 py-8 sm:px-10 sm:py-12 text-left overflow-hidden flex flex-col transition-all duration-500 ease-out ${className} ${
                    isFront ? '' : 'cursor-pointer'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <f.icon
                    aria-hidden="true"
                    className="absolute -bottom-4 -right-4 w-44 h-44 sm:w-56 sm:h-56 text-neutral-900/[0.18] dark:text-white/[0.15] rotate-[-8deg] pointer-events-none select-none"
                  />
                  <D2
                    aria-hidden="true"
                    className="absolute top-8 right-8 w-12 h-12 sm:w-14 sm:h-14 text-neutral-900/[0.14] dark:text-white/[0.11] rotate-[18deg] blur-[3px] pointer-events-none select-none"
                  />
                  <D3
                    aria-hidden="true"
                    className="absolute top-1/2 left-4 w-9 h-9 sm:w-11 sm:h-11 text-neutral-900/[0.09] dark:text-white/[0.07] rotate-[-14deg] blur-[3px] pointer-events-none select-none"
                  />
                  <div className="relative">
                    <h3 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">{f.title}</h3>
                    <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
