import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Download from '@/components/Download'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 antialiased transition-colors">
      <Navbar />
      <Hero />
      <section aria-label="Features and how it works" className="px-4 sm:px-6">
        <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-2 items-stretch">
          <div className="border border-neutral-300 dark:border-neutral-800 rounded-3xl overflow-hidden flex min-w-0 bg-neutral-50 dark:bg-neutral-900/50">
            <Features />
          </div>
          <div className="border border-neutral-300 dark:border-neutral-800 rounded-3xl overflow-hidden flex min-w-0 bg-neutral-50 dark:bg-neutral-900/50">
            <HowItWorks />
          </div>
        </div>
      </section>
      <Download />
      <Footer />
    </main>
  )
}
