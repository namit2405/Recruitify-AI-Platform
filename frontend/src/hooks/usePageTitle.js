import { useEffect } from 'react';

/**
 * Custom hook to set dynamic page titles
 * @param {string} title - The page title (will be appended with " | Recruitify")
 * @param {boolean} includeAppName - Whether to include the app name (default: true)
 */
export function usePageTitle(title, includeAppName = true) {
  useEffect(() => {
    const appName = 'Recruitify Management Platform';
    const fullTitle = includeAppName && title ? `${title} | ${appName}` : title || appName;
    
    document.title = fullTitle;
    
    // Cleanup: reset to default title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [title, includeAppName]);
}

/**
 * Helper function to get page title based on route
 * @param {string} pathname - The current route pathname
 * @returns {string} - The page title
 */
export function getTitleFromPath(pathname) {
  const titleMap = {
    '/': 'Home',
    '/login': 'Login',
    '/register': 'Register',
    '/register/candidate': 'Candidate Registration',
    '/register/organization': 'Organization Registration',
    '/verify-otp': 'Verify OTP',
    
    // Candidate routes
    '/candidate/dashboard': 'Dashboard',
    '/candidate/jobs': 'Browse Jobs',
    '/candidate/applications': 'My Applications',
    '/candidate/profile': 'My Profile',
    '/candidate/analytics': 'My Analytics',
    
    // Organization routes
    '/organization/dashboard': 'Dashboard',
    '/organization/post-vacancy': 'Post a Job',
    '/organization/vacancies': 'Manage Vacancies',
    '/organization/candidates': 'Review Candidates',
    '/organization/resumes': 'Browse Resumes',
    '/organization/analytics': 'Analytics',
    '/organization/profile': 'Company Profile',
    
    // Common routes
    '/chat': 'Messages',
    '/notifications': 'Notifications',
    '/search': 'Search',
    '/documentation': 'Documentation',
  };
  
  // Check for exact match
  if (titleMap[pathname]) {
    return titleMap[pathname];
  }
  
  // Check for dynamic routes
  if (pathname.startsWith('/vacancy/')) {
    return 'Job Details';
  }
  if (pathname.startsWith('/applications/') && pathname.includes('/analysis')) {
    return 'Application Analysis';
  }
  if (pathname.startsWith('/public/candidate/')) {
    return 'Candidate Profile';
  }
  if (pathname.startsWith('/public/organization/')) {
    return 'Company Profile';
  }
  
  // Default
  return 'Recruitify Management Platform';
}
