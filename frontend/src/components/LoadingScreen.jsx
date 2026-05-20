import { Briefcase } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src="/images/Page, Features-dark.png"
            alt="Recruitify"
            className="hidden dark:block h-24 w-auto"
          />
          <img
            src="/images/Page-light.png"
            alt="Recruitify"
            className="block dark:hidden h-24 w-auto"
          />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Recruitify
        </h1>
        
        {/* Loading Animation */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}
