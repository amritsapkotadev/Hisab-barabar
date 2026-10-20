import { FaMobileAlt, FaQrcode, FaShieldAlt, FaGooglePlay, FaApple } from 'react-icons/fa'

const points = [
  { icon: FaMobileAlt, title: 'Built for thumbs', body: 'Log a bill in seconds.' },
  { icon: FaQrcode, title: 'Join by QR or code', body: 'Friends join instantly.' },
  { icon: FaShieldAlt, title: 'Private by default', body: 'Free, no card required.' },
]

const stats = [
  { value: '10k+', label: 'active groups' },
  { value: 'Rs. 50Cr+', label: 'expenses tracked' },
  { value: '4.8', label: 'average rating' },
]

export default function Download() {
  return (
    <section id="download" className="py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-6 sm:p-10 relative overflow-hidden">
        <FaGooglePlay
          aria-hidden="true"
          className="absolute -bottom-8 -right-8 w-40 h-40 sm:w-52 sm:h-52 text-neutral-900/[0.09] dark:text-white/[0.06] rotate-[12deg] blur-[4px] pointer-events-none select-none"
        />
        <FaGooglePlay
          aria-hidden="true"
          className="absolute top-8 left-1/3 w-14 h-14 text-neutral-900/[0.10] dark:text-white/[0.08] rotate-[-12deg] blur-[5px] pointer-events-none select-none"
        />
        <FaApple
          aria-hidden="true"
          className="absolute top-4 right-2 w-16 h-16 sm:w-20 sm:h-20 text-neutral-900/[0.11] dark:text-white/[0.08] rotate-[10deg] blur-[4px] pointer-events-none select-none"
        />
        <FaGooglePlay
          aria-hidden="true"
          className="absolute bottom-16 left-8 w-10 h-10 text-neutral-900/[0.09] dark:text-white/[0.07] rotate-[20deg] blur-[6px] pointer-events-none select-none"
        />
        <div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Start your first group tonight
          </h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg">
            Android is ready now, iOS follows via TestFlight.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="https://expo.dev/artifacts/eas/oMnPFe91ANAudPC9gG89tT.apk"
              download
              className="inline-flex items-center justify-center gap-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-7 py-3.5 rounded-full font-medium hover:opacity-85 transition-opacity"
            >
              <FaGooglePlay className="w-4 h-4" aria-hidden="true" />
              Download Android APK
            </a>
            <span className="inline-flex items-center justify-center gap-2.5 border border-neutral-300 dark:border-neutral-700 px-7 py-3.5 rounded-full text-neutral-600 dark:text-neutral-300">
              <FaApple className="w-4 h-4" aria-hidden="true" />
              iOS: join the waitlist
            </span>
          </div>

          <dl className="mt-8 flex gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight">{s.value}</dd>
                <dd className="text-sm text-neutral-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="grid gap-3">
          {points.map((p) => (
            <li
              key={p.title}
              className="flex gap-4 items-start bg-white dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 sm:p-5 shadow-[4px_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_4px_12px_rgba(0,0,0,0.15)]"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center">
                <p.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{p.title}</span>
                <span className="block mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
