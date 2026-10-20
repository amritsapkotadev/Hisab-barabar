import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy - Hisab Barabar',
  description: 'Privacy Policy for Hisab Barabar - Learn how we protect your data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">Privacy Policy</h1>
            <p className="mt-4 text-neutral-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] space-y-8">
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">1. Introduction</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Welcome to Hisab Barabar ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">2. Information We Collect</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">2.1 Personal Information</h3>
                  <p>When you create an account, we collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Profile picture (optional)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">2.2 Financial Information</h3>
                  <p>We collect and store:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Expense details (amounts, descriptions, dates)</li>
                    <li>Group information and memberships</li>
                    <li>Transaction history</li>
                    <li>Settlement records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">2.3 Technical Information</h3>
                  <p>We automatically collect:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Device information (model, OS version)</li>
                    <li>IP address</li>
                    <li>App usage data</li>
                    <li>Crash reports and diagnostics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">3. How We Use Your Information</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 dark:text-neutral-400 marker:text-neutral-400">
                <li>Provide and maintain our services</li>
                <li>Process and track expenses</li>
                <li>Enable group expense sharing</li>
                <li>Send notifications about expenses and settlements</li>
                <li>Improve our app and user experience</li>
                <li>Provide customer support</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">4. Data Sharing and Disclosure</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4.1 With Other Users</h3>
                  <p>
                    When you join a group, your name, profile picture, and expense information within that group are visible to other group members.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4.2 Service Providers</h3>
                  <p>We may share information with trusted third-party service providers who assist us in:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Cloud hosting (MongoDB Atlas)</li>
                    <li>Push notifications (Firebase)</li>
                    <li>Email services</li>
                    <li>Analytics and crash reporting</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4.3 Legal Requirements</h3>
                  <p>
                    We may disclose your information if required by law, court order, or governmental authority.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">4.4 What We Don't Do</h3>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    We will NEVER sell your personal information to third parties for marketing purposes.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">5. Data Security</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 dark:text-neutral-400 marker:text-neutral-400">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure authentication with JWT tokens</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">6. Your Rights</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 dark:text-neutral-400 marker:text-neutral-400">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-4">
                To exercise these rights, contact us at support@hisabbarabar.com or use the in-app settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">7. Data Retention</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we're required to retain it for legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">8. Children's Privacy</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Our services are not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">9. International Data Transfers</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">10. Changes to This Policy</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">11. Contact Us</h2>
              <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p className="mb-3">If you have questions about this Privacy Policy, please contact us:</p>
                <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4">
                  <p><strong>Email:</strong> support@hisabbarabar.com</p>
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
