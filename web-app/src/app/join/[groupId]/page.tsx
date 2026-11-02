import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Join a group - Hisab Barabar',
  description: 'Open your Hisab Barabar group invite in the app.',
}

export default function JoinPage({ params }: { params: { groupId: string } }) {
  const deepLink = `hisabbarabar://join/${params.groupId}`

  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-md mx-auto text-center">
          <img
            src="/logo.jpeg"
            alt="Hisab Barabar logo"
            className="w-24 h-24 rounded-3xl mx-auto object-cover shadow-[8px_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.3)]"
          />

          <h1 className="mt-8 text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            You have a group invite
          </h1>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Open this invite in the Hisab Barabar app to join the group and start splitting expenses.
          </p>

          <a
            href={deepLink}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Open in app
          </a>

          <a
            href="/"
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-neutral-300 px-6 py-4 text-base font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            Go to website
          </a>

          <p className="mt-8 text-sm text-neutral-500 dark:text-neutral-400">
            Don't have the app yet? Install Hisab Barabar, then open this link again.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  )
}
