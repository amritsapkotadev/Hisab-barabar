import Link from 'next/link'
import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
      />

      <div className="max-w-6xl mx-auto grid gap-14 lg:grid-cols-2 lg:items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl min-[480px]:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
            Split the bill.
            <br />
            Keep the friendship.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Groups, flexible splits, and the fewest payments to settle up. Free on Android, iOS coming soon.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a
              href="https://expo.dev/artifacts/eas/oMnPFe91ANAudPC9gG89tT.apk"
              download
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-8 py-3.5 rounded-full font-medium hover:opacity-85 transition-opacity text-center"
            >
              Download for Android
            </a>
            <Link
              href="#how-it-works"
              className="border border-neutral-300 dark:border-neutral-700 px-8 py-3.5 rounded-full font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-center"
            >
              How it works
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="relative justify-self-center py-6 order-first lg:order-none">
          <div className="relative w-48 max-w-full sm:w-72">
            <div
              className="absolute overflow-hidden bg-[#F8F9FA] flex flex-col"
              style={{ left: '4.36%', top: '1.88%', width: '91.28%', height: '96.38%', borderRadius: '13.76% / 6.36%' }}
            >
              <div className="absolute inset-0 z-20 pointer-events-none rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.09)_16%,rgba(255,255,255,0)_36%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.05)_100%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]" />

              <Image
                src="/screenshot.jpg"
                alt=""
                fill
                priority
                sizes="(min-width: 640px) 263px, 175px"
                className="object-cover object-top"
              />
            </div>

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-[78%] rounded-[100%] bg-black/25 blur-xl dark:bg-black/50" />

            <img
              src="/phone-frame.png"
              alt=""
              className="relative w-full h-auto pointer-events-none select-none [filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.32))_drop-shadow(0_16px_28px_rgba(0,0,0,0.18))] dark:[filter:drop-shadow(0_3px_5px_rgba(0,0,0,0.5))_drop-shadow(0_16px_28px_rgba(0,0,0,0.35))]"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
