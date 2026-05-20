import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FileText, UserCheck, AlertTriangle, Ban, Scale, Mail, Briefcase, Shield } from 'lucide-react';

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

export default function TermsOfServicePage() {
  usePageTitle('Terms of Service');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Terms of Service</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Last updated: May 5, 2026</p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              These Terms of Service ("Terms") govern your use of the Recruitify platform operated by Recruitify AI Technologies Inc. By creating an account or using our services, you agree to be bound by these Terms.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">

          <Section icon={UserCheck} title="Eligibility & Account Registration">
            <p>To use Recruitify, you must:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Be at least 16 years of age</li>
              <li>Provide accurate and truthful information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized account access</li>
            </ul>
            <p className="mt-3">You are responsible for all activity that occurs under your account. One person or legal entity may not maintain more than one account of the same type.</p>
          </Section>

          <Section icon={Briefcase} title="Candidate Responsibilities">
            <p>As a candidate on Recruitify, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Provide accurate information in your profile, resume, and applications</li>
              <li>Not misrepresent your qualifications, experience, or identity</li>
              <li>Only apply for positions you genuinely intend to pursue</li>
              <li>Respond to organizations in a timely and professional manner</li>
              <li>Not use the platform to collect information about organizations for competitive purposes</li>
            </ul>
          </Section>

          <Section icon={Briefcase} title="Organization Responsibilities">
            <p>As an organization on Recruitify, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Post only genuine, legal job vacancies</li>
              <li>Not discriminate against candidates based on protected characteristics</li>
              <li>Use candidate data only for legitimate hiring purposes</li>
              <li>Not share candidate resumes or personal data with third parties without consent</li>
              <li>Respond to candidates who have applied within a reasonable timeframe</li>
              <li>Accurately represent your organization, its culture, and the roles you post</li>
            </ul>
          </Section>

          <Section icon={Ban} title="Prohibited Conduct">
            <p>The following activities are strictly prohibited on Recruitify:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Posting fraudulent, misleading, or illegal job listings</li>
              <li>Harvesting user data through automated scraping or bots</li>
              <li>Sending unsolicited commercial messages (spam)</li>
              <li>Impersonating another person, organization, or Recruitify staff</li>
              <li>Uploading malicious files, viruses, or harmful code</li>
              <li>Attempting to gain unauthorized access to other accounts or systems</li>
              <li>Using the platform for any illegal purpose</li>
              <li>Posting content that is discriminatory, harassing, or offensive</li>
            </ul>
            <p className="mt-3">Violations may result in immediate account suspension or termination without notice.</p>
          </Section>

          <Section icon={Shield} title="Intellectual Property">
            <p>All content on the Recruitify platform — including the AI matching algorithms, UI design, logos, and documentation — is owned by Recruitify AI Technologies Inc. and protected by copyright law.</p>
            <p className="mt-3">You retain ownership of content you upload (resumes, profile information, posts). By uploading content, you grant Recruitify a non-exclusive, royalty-free license to use, display, and process that content to provide the service.</p>
          </Section>

          <Section icon={AlertTriangle} title="Disclaimers & Limitation of Liability">
            <p>Recruitify is provided "as is" without warranties of any kind. We do not guarantee:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>That you will find employment or hire a candidate through our platform</li>
              <li>The accuracy of AI match scores or recommendations</li>
              <li>Uninterrupted or error-free service availability</li>
            </ul>
            <p className="mt-3">To the maximum extent permitted by law, Recruitify's liability for any claim arising from use of the platform is limited to the amount you paid us in the 12 months preceding the claim, or ₹1,000 INR, whichever is greater.</p>
          </Section>

          <Section icon={Scale} title="Governing Law & Disputes">
            <p>These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of Recruitify shall be resolved through binding arbitration in Jalandhar, Punjab, India, except where prohibited by law.</p>
            <p className="mt-3">Before initiating arbitration, you agree to first contact us at recruitify26@gmail.com to attempt informal resolution.</p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>For questions about these Terms, contact us:</p>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <p><strong className="text-gray-900 dark:text-white">Email:</strong> recruitify26@gmail.com</p>
              <p><strong className="text-gray-900 dark:text-white">Address:</strong> Suranussi, Jalandhar, Punjab 144027, India</p>
            </div>
          </Section>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>We reserve the right to modify these Terms at any time. We will provide at least 14 days' notice of material changes via email or in-app notification. Continued use after the effective date constitutes acceptance.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
