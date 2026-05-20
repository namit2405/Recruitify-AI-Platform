import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Cookie, Shield, BarChart3, Settings, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

function CookieToggle({ title, description, icon: Icon, iconBg, required, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
            {required && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={() => !required && onChange(!enabled)}
        disabled={required}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        } ${required ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-checked={enabled}
        role="switch"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function CookieSettingsPage() {
  usePageTitle('Cookie Settings');

  const [analytics, setAnalytics] = useState(() => {
    return localStorage.getItem('cookie_analytics') !== 'false';
  });
  const [preferences, setPreferences] = useState(() => {
    return localStorage.getItem('cookie_preferences') !== 'false';
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('cookie_analytics', String(analytics));
    localStorage.setItem('cookie_preferences', String(preferences));
    setSaved(true);
    toast.success('Cookie preferences saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAcceptAll = () => {
    setAnalytics(true);
    setPreferences(true);
    localStorage.setItem('cookie_analytics', 'true');
    localStorage.setItem('cookie_preferences', 'true');
    toast.success('All cookies accepted');
  };

  const handleRejectAll = () => {
    setAnalytics(false);
    setPreferences(false);
    localStorage.setItem('cookie_analytics', 'false');
    localStorage.setItem('cookie_preferences', 'false');
    toast.success('Optional cookies rejected');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Cookie Settings</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We use cookies and similar technologies to keep you logged in, remember your preferences, and understand how you use Recruitify. You can manage your preferences below.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">

          <CookieToggle
            icon={Shield}
            iconBg="bg-green-600"
            title="Essential Cookies"
            description="Required for the platform to function. These include authentication tokens that keep you logged in, CSRF protection, and session management. Cannot be disabled."
            required
            enabled
            onChange={() => {}}
          />

          <CookieToggle
            icon={Settings}
            iconBg="bg-blue-600"
            title="Preference Cookies"
            description="Remember your settings such as dark/light mode theme, language preferences, and UI layout choices so you don't have to reconfigure them on every visit."
            required={false}
            enabled={preferences}
            onChange={setPreferences}
          />

          <CookieToggle
            icon={BarChart3}
            iconBg="bg-purple-600"
            title="Analytics Cookies"
            description="Help us understand how users interact with Recruitify — which features are used most, where users encounter issues, and how to improve the platform. All data is anonymized."
            required={false}
            enabled={analytics}
            onChange={setAnalytics}
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              {saved ? <CheckCircle className="h-4 w-4" /> : null}
              {saved ? 'Saved!' : 'Save Preferences'}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold rounded-lg transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleRejectAll}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold rounded-lg transition-colors"
            >
              Reject Optional
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">About Our Cookies</p>
            <p>Recruitify does not use third-party advertising cookies or sell your browsing data. Our cookies are used solely to provide and improve the service. For more details, see our <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
