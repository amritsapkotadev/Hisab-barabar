import { FaUserPlus, FaQrcode, FaReceipt, FaExchangeAlt } from 'react-icons/fa'
import type { IconType } from 'react-icons'

const steps: { title: string; body: string; icon: IconType }[] = [
  { title: 'Create a group', body: 'Name the trip, flat, or occasion. One shared book.', icon: FaUserPlus },
  { title: 'Invite friends', body: 'Share a code or QR. Past entries stay intact.', icon: FaQrcode },
  { title: 'Add as you spend', body: 'Log the bill, pick payer and split. Seconds, not forms.', icon: FaReceipt },
  { title: 'Settle up', body: 'Follow the shortest path and mark it settled.', icon: FaExchangeAlt },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="p-4 sm:p-5 w-full h-full">
      <div className="flex flex-col gap-3 sm:gap-4 h-full">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">How it works</h2>
        </div>
        <ol className="flex flex-col gap-2 flex-1">
          {steps.map((s, i) => (
            <li key={s.title} className="relative overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl shadow-[4px_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_4px_12px_rgba(0,0,0,0.25)] p-3 sm:p-4 flex gap-3 items-center flex-1">
              <s.icon
                aria-hidden="true"
                className="absolute -bottom-2 -right-2 w-12 h-12 sm:w-14 sm:h-14 text-neutral-900/[0.18] dark:text-white/[0.15] rotate-[-8deg] blur-[3px] pointer-events-none select-none"
              />
              <p className="relative w-10 h-10 shrink-0 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-semibold text-sm text-neutral-500">0{i + 1}</p>
              <div className="relative min-w-0">
                <h3 className="font-semibold text-xl leading-snug">{s.title}</h3>
                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400 leading-snug">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
