import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Eye, Lock, Database, Bell, UserCheck, Globe, Mail } from 'lucide-react';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-gray-600 dark:text-gray-400 space-y-3 leading-relaxed pl-12">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  usePageTitle('Privacy Policy');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Last updated: May 5, 2026
            </p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              At Recruitify, we take your privacy seriously. This policy explains what data we collect, how we use it, and the choices you have. By using Recruitify, you agree to the practices described here.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">

          <Section icon={Database} title="Information We Collect">
            <p><strong className="text-gray-900 dark:text-white">Account Information:</strong> When you register, we collect your name, email address, password (hashed), and account type (candidate or organization).</p>
            <p><strong className="text-gray-900 dark:text-white">Profile Data:</strong> Candidates may provide skills, work experience, education, resume files, profile pictures, and social links. Organizations may provide company descriptions, logos, and contact details.</p>
            <p><strong className="text-gray-900 dark:text-white">Usage Data:</strong> We collect information about how you interact with the platform — pages visited, features used, search queries, and application activity.</p>
            <p><strong className="text-gray-900 dark:text-white">Communications:</strong> Messages sent through our chat system are stored to provide the service. We do not read private messages except when required by law or to investigate abuse.</p>
          </Section>

          <Section icon={Eye} title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and improve the Recruitify platform and its features</li>
              <li>To match candidates with relevant job opportunities using AI</li>
              <li>To enable organizations to review and contact candidates</li>
              <li>To send transactional emails (OTP verification, application updates, job offers)</li>
              <li>To send optional job alerts and platform notifications (you can opt out)</li>
              <li>To analyze usage patterns and improve our AI matching algorithms</li>
              <li>To detect and prevent fraud, abuse, and security incidents</li>
            </ul>
          </Section>

          <Section icon={Globe} title="Information Sharing">
            <p>We do not sell your personal data to third parties. We share data only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-gray-900 dark:text-white">With Organizations:</strong> When you apply for a job, your profile and resume are shared with that organization.</li>
              <li><strong className="text-gray-900 dark:text-white">Public Profiles:</strong> Information you mark as public (name, skills, experience) is visible to all logged-in users.</li>
              <li><strong className="text-gray-900 dark:text-white">Service Providers:</strong> We use trusted third-party services (email delivery, cloud storage) that process data on our behalf under strict data processing agreements.</li>
              <li><strong className="text-gray-900 dark:text-white">Legal Requirements:</strong> We may disclose data when required by law, court order, or to protect the rights and safety of our users.</li>
            </ul>
          </Section>

          <Section icon={Lock} title="Data Security">
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Passwords are hashed using bcrypt — we never store plain-text passwords</li>
              <li>All data is transmitted over HTTPS/TLS encryption</li>
              <li>Access to production databases is restricted to authorized personnel only</li>
              <li>Resume files and media are stored in access-controlled cloud storage</li>
              <li>JWT tokens expire after 24 hours; refresh tokens after 7 days</li>
            </ul>
            <p className="mt-3">Despite these measures, no system is 100% secure. Please use a strong, unique password and enable two-factor authentication when available.</p>
          </Section>

          <Section icon={UserCheck} title="Your Rights & Choices">
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-gray-900 dark:text-white">Access:</strong> View all data we hold about you from your profile and settings pages</li>
              <li><strong className="text-gray-900 dark:text-white">Correction:</strong> Update your information at any time from your profile</li>
              <li><strong className="text-gray-900 dark:text-white">Deletion:</strong> Request account deletion by contacting us at recruitify26@gmail.com</li>
              <li><strong className="text-gray-900 dark:text-white">Portability:</strong> Export your application history and analytics data</li>
              <li><strong className="text-gray-900 dark:text-white">Opt-out:</strong> Manage notification preferences from Settings → Notifications</li>
              <li><strong className="text-gray-900 dark:text-white">Profile Visibility:</strong> Control who can see your profile from Settings → Privacy</li>
            </ul>
          </Section>

          <Section icon={Bell} title="Cookies & Tracking">
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Keep you logged in (authentication tokens stored in localStorage)</li>
              <li>Remember your theme preference (dark/light mode)</li>
              <li>Analyze platform usage to improve features</li>
            </ul>
            <p className="mt-3">We do not use third-party advertising cookies. You can manage cookie preferences from the Cookie Settings page.</p>
          </Section>

          <Section icon={Mail} title="Contact Us">
            <p>If you have questions about this Privacy Policy or want to exercise your rights, contact us:</p>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <p><strong className="text-gray-900 dark:text-white">Email:</strong> recruitify26@gmail.com</p>
              <p><strong className="text-gray-900 dark:text-white">Address:</strong> Suranussi, Jalandhar, Punjab 144027, India</p>
              <p><strong className="text-gray-900 dark:text-white">Response time:</strong> Within 5 business days</p>
            </div>
          </Section>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>This policy may be updated periodically. We will notify you of significant changes via email or an in-app notification. Continued use of Recruitify after changes constitutes acceptance of the updated policy.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
