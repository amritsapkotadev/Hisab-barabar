import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'About Us - Hisab Barabar',
  description: 'Learn more about Hisab Barabar and our mission to make expense splitting simple and fair.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
              About Hisab Barabar
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              Making expense splitting simple, fair, and hassle-free for everyone.
            </p>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">Our story</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                  Hisab Barabar was born out of a simple yet common problem: splitting expenses with friends and family often leads to confusion, awkwardness, and sometimes even conflicts. We've all been there, trying to remember who paid for what, calculating complicated splits, and dealing with the uncomfortable task of asking friends to pay you back.
                </p>
                <p>
                  In 2024, a group of friends on a trip to the mountains faced this exact challenge. After returning home, they spent hours trying to figure out who owed whom. That's when the idea struck: what if there was an app that could handle all of this automatically?
                </p>
                <p>
                  Thus, Hisab Barabar (meaning "Accounts Settled" in Hindi) was created. Our mission is simple: to help people split expenses fairly and transparently, so they can focus on what truly matters: enjoying time with friends and family.
                </p>
              </div>
            </section>

            <section className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-4">Our mission</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                To make expense management effortless and transparent, enabling people to maintain healthy financial relationships with their friends and family. We believe that money shouldn't come between relationships, and our app ensures that it doesn't.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold tracking-tight mb-5 text-center">Our values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Every transaction is clearly recorded and visible to all group members. No hidden calculations, no confusion.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Privacy</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Your financial data is encrypted and secure. We never share your information with third parties.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Simplicity</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Complex calculations made simple. Our intuitive interface makes expense splitting effortless.
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)]">
                  <div className="w-12 h-12 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Community</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Building a community where financial transparency strengthens relationships, not weakens them.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
