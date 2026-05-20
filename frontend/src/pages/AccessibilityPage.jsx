import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Accessibility, Monitor, Keyboard, Eye, Volume2, Mail, CheckCircle } from 'lucide-react';

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

function FeatureItem({ children }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function AccessibilityPage() {
  usePageTitle('Accessibility');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Accessibility className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Accessibility</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Last updated: May 5, 2026</p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              Recruitify is committed to making our platform accessible to everyone, including people with disabilities. We strive to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">

          <Section icon={Monitor} title="Our Commitment">
            <p>We believe that everyone deserves equal access to employment opportunities. Recruitify is designed with accessibility in mind from the ground up. We continuously work to improve the experience for users who rely on assistive technologies.</p>
            <p>Our accessibility efforts include regular audits, user testing with assistive technology users, and ongoing developer training on accessible design patterns.</p>
          </Section>

          <Section icon={Eye} title="Visual Accessibility">
            <ul className="space-y-2">
              <FeatureItem>Full dark mode support to reduce eye strain in low-light environments</FeatureItem>
              <FeatureItem>High contrast color combinations throughout the interface</FeatureItem>
              <FeatureItem>Text sizes that respect browser font size preferences</FeatureItem>
              <FeatureItem>All images include descriptive alt text for screen readers</FeatureItem>
              <FeatureItem>Color is never used as the sole means of conveying information — status badges include text labels</FeatureItem>
              <FeatureItem>Focus indicators are visible on all interactive elements</FeatureItem>
              <FeatureItem>Minimum 4.5:1 contrast ratio for normal text (WCAG AA)</FeatureItem>
            </ul>
          </Section>

          <Section icon={Keyboard} title="Keyboard Navigation">
            <ul className="space-y-2">
              <FeatureItem>All interactive elements are reachable via keyboard (Tab / Shift+Tab)</FeatureItem>
              <FeatureItem>Logical tab order follows the visual layout of the page</FeatureItem>
              <FeatureItem>Modal dialogs trap focus correctly and return focus on close</FeatureItem>
              <FeatureItem>Dropdown menus and select components support arrow key navigation</FeatureItem>
              <FeatureItem>Skip-to-content links available on all pages</FeatureItem>
              <FeatureItem>Forms can be submitted using the Enter key</FeatureItem>
            </ul>
          </Section>

          <Section icon={Volume2} title="Screen Reader Support">
            <ul className="space-y-2">
              <FeatureItem>Semantic HTML5 elements used throughout (nav, main, header, footer, article)</FeatureItem>
              <FeatureItem>ARIA labels and roles applied to complex interactive components</FeatureItem>
              <FeatureItem>Live regions announce dynamic content updates (notifications, form errors)</FeatureItem>
              <FeatureItem>Form inputs have associated labels and descriptive error messages</FeatureItem>
              <FeatureItem>Tables include proper headers and captions</FeatureItem>
              <FeatureItem>Icon-only buttons include accessible text via aria-label</FeatureItem>
            </ul>
            <p className="mt-3">We test with NVDA (Windows), VoiceOver (macOS/iOS), and TalkBack (Android).</p>
          </Section>

          <Section icon={Monitor} title="Known Limitations">
            <p>While we strive for full accessibility, some areas are still being improved:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>The real-time video/voice call feature has limited screen reader support — we are working on improvements</li>
              <li>Some complex data charts may not be fully accessible to screen readers — tabular data alternatives are being added</li>
              <li>The drag-and-drop hiring pipeline has keyboard alternatives but the experience is still being refined</li>
            </ul>
            <p className="mt-3">We prioritize fixing accessibility issues as soon as they are identified.</p>
          </Section>

          <Section icon={Mail} title="Feedback & Support">
            <p>If you encounter an accessibility barrier on Recruitify, please let us know. Your feedback directly helps us improve.</p>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl space-y-1">
              <p><strong className="text-gray-900 dark:text-white">Email:</strong> recruitify26@gmail.com</p>
              <p><strong className="text-gray-900 dark:text-white">Subject line:</strong> Accessibility Feedback</p>
              <p><strong className="text-gray-900 dark:text-white">Response time:</strong> Within 3 business days</p>
            </div>
            <p className="mt-3">Please include the page URL, the assistive technology you are using, and a description of the issue. We will respond with a timeline for resolution or an alternative way to access the content.</p>
          </Section>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>This accessibility statement was last reviewed on May 5, 2026. We conduct accessibility audits quarterly and update this statement accordingly.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
