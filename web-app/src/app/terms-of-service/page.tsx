import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service - Hisab Barabar',
  description: 'Terms of Service for Hisab Barabar - Read our terms and conditions.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">Terms of Service</h1>
            <p className="mt-4 text-neutral-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] space-y-8">
            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">1. Agreement to Terms</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                By accessing or using Hisab Barabar ("the App," "our App," or "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access or use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">2. Description of Service</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">
                Hisab Barabar is a mobile and web application that helps users:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 dark:text-neutral-400 marker:text-neutral-400">
                <li>Track and split shared expenses</li>
                <li>Manage group finances</li>
                <li>Calculate and settle debts</li>
                <li>Record personal expenses</li>
              </ul>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mt-4">
                The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any part of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">3. User Accounts</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">3.1 Account Creation</h3>
                  <p>To use our Service, you must:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Be at least 13 years old</li>
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">3.2 Account Responsibilities</h3>
                  <p>You are responsible for:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 marker:text-neutral-400">
                    <li>Maintaining the confidentiality of your password</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Ensuring your contact information is current</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">3.3 Account Termination</h3>
                  <p>
                    We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activities.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">4. User Conduct</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-3">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 dark:text-neutral-400 marker:text-neutral-400">
                <li>Use the Service for any illegal purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Upload malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Impersonate any person or entity</li>
                <li>Collect or harvest user information without consent</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">5. Expense Information</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">5.1 Accuracy</h3>
                  <p>
                    You are responsible for the accuracy of expense information you enter. We are not responsible for errors or disputes arising from incorrect data entry.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">5.2 Not a Payment Service</h3>
                  <p className="font-semibold text-neutral-900 dark:text-white">
                    Important: Hisab Barabar is a tracking and calculation tool ONLY. We do not process payments, hold funds, or facilitate money transfers. All financial settlements must be made directly between users outside our platform.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">5.3 Dispute Resolution</h3>
                  <p>
                    We are not responsible for resolving financial disputes between users. Any disagreements about expenses or settlements must be resolved directly between the parties involved.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">6. Intellectual Property</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">6.1 Our Rights</h3>
                  <p>
                    The Service, including its design, features, code, and content, is owned by us and protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">6.2 Your Rights</h3>
                  <p>
                    You retain ownership of the data you input into the Service. By using our Service, you grant us a license to use, store, and process your data solely to provide the Service.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">7. Disclaimers</h2>
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 space-y-3 text-neutral-700 dark:text-neutral-300">
                <p className="font-semibold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</p>
                <p>We do not guarantee that:</p>
                <ul className="list-disc pl-6 space-y-1 marker:text-neutral-400">
                  <li>The Service will be uninterrupted or error-free</li>
                  <li>Defects will be corrected</li>
                  <li>The Service is free of viruses or harmful components</li>
                  <li>Results obtained from the Service will be accurate or reliable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">8. Limitation of Liability</h2>
              <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed space-y-3">
                <p>
                  To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-1 marker:text-neutral-400">
                  <li>Loss of profits or revenue</li>
                  <li>Loss of data</li>
                  <li>Business interruption</li>
                  <li>Financial disputes between users</li>
                </ul>
                <p>
                  Our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the past 12 months (or $100 if no payment was made).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">9. Indemnification</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                You agree to indemnify and hold harmless Hisab Barabar, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">10. Modifications to Service and Terms</h2>
              <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p>
                  We reserve the right to modify or discontinue the Service at any time, with or without notice. We may also update these Terms from time to time.
                </p>
                <p>
                  Continued use of the Service after changes to the Terms constitutes acceptance of the modified Terms. We will notify users of significant changes via email or in-app notification.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">11. Governing Law</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Nepal/India, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in Nepal/India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">12. Severability</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">13. Contact Information</h2>
              <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <p className="mb-3">For questions about these Terms of Service, please contact us:</p>
                <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-4">
                  <p><strong>Email:</strong> support@hisabbarabar.com</p>
                  <p><strong>Address:</strong> Nepal/India</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-tight mb-3">14. Entire Agreement</h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                These Terms constitute the entire agreement between you and Hisab Barabar regarding the use of the Service and supersede all prior agreements and understandings.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
