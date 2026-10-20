import Link from 'next/link'
import { FaHome, FaUsers, FaExchangeAlt, FaUser, FaWifi, FaBatteryFull, FaSignal } from 'react-icons/fa'

const groups = [
  { name: 'Weekend Trip', members: 4, amount: '+Rs 1,240', tone: 'text-emerald-600', avatars: ['A', 'S', 'P'] },
  { name: 'Flat 3B', members: 3, amount: '-Rs 520', tone: 'text-red-500', avatars: ['R', 'M', 'K'] },
  { name: 'Office Lunch', members: 6, amount: 'Settled', tone: 'text-[#64748B]', avatars: ['N', 'B', 'T'] },
]

const avatarBg = ['bg-[#4361EE]', 'bg-[#3A0CA3]', 'bg-[#4CC9F0]']

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

              <div className="bg-gradient-to-br from-[#4361EE] to-[#3A0CA3] px-5 pt-3 pb-12 rounded-b-[32px] text-white">
                <div className="flex items-center justify-between text-[10px] font-medium">
                  <span>9:41</span>
                  <span className="flex items-center gap-1.5">
                    <FaSignal className="w-2.5 h-2.5" />
                    <FaWifi className="w-2.5 h-2.5" />
                    <FaBatteryFull className="w-3 h-3" />
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-[11px] text-white/70">Namaste</p>
                  <p className="text-sm font-semibold">Aashish</p>
                </div>
                <p className="mt-5 text-[10px] text-white/70">Net balance</p>
                <p className="text-2xl font-semibold tracking-tight">Rs. 720</p>
                <p className="text-[10px] text-white/70">owed to you</p>
              </div>

              <div className="-mt-8 px-4 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm">
                  <p className="text-[10px] text-[#64748B]">Owed to you</p>
                  <p className="text-sm font-semibold text-emerald-600">Rs. 1,240</p>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-sm">
                  <p className="text-[10px] text-[#64748B]">You owe</p>
                  <p className="text-sm font-semibold text-red-500">Rs. 520</p>
                </div>
              </div>

              <div className="px-4 mt-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-[#1E293B]">Your groups</p>
                  <p className="text-[10px] text-[#4361EE]">See all</p>
                </div>
                <div className="mt-2 space-y-2">
                  {groups.map((g) => (
                    <div key={g.name} className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center gap-3">
                      <div className="flex -space-x-2 shrink-0">
                        {g.avatars.map((a, i) => (
                          <span
                            key={a}
                            className={`w-6 h-6 rounded-full border-2 border-white text-[8px] font-semibold text-white flex items-center justify-center ${avatarBg[i % avatarBg.length]}`}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#1E293B] truncate">{g.name}</p>
                        <p className="text-[9px] text-[#64748B]">{g.members} members</p>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ${g.tone}`}>{g.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto bg-white border-t border-[#E2E8F0] px-7 py-3 flex items-center justify-between">
                <FaHome className="w-4 h-4 text-[#4361EE]" />
                <FaUsers className="w-4 h-4 text-[#CBD5E1]" />
                <FaExchangeAlt className="w-4 h-4 text-[#CBD5E1]" />
                <FaUser className="w-4 h-4 text-[#CBD5E1]" />
              </div>
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
