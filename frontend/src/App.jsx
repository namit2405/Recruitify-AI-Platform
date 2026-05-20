import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGetCallerUserProfile } from "./hooks/useQueries";

import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useLocation,
} from "@tanstack/react-router";

import { Toaster } from "./components/ui/sonner";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterOrganizationPage from "./pages/RegisterOrganizationPage";
import RegisterCandidatePage from "./pages/RegisterCandidatePage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import NotificationsPage from "./pages/NotificationsPage";
import DocumentationPage from "./pages/DocumentationPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import CookieSettingsPage from "./pages/CookieSettingsPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

import OrganizationDashboard from "./pages/organization/OrganizationDashboard";
import PostVacancyPage from "./pages/organization/PostVacancyPage";
import VacancyManagementPage from "./pages/organization/VacancyManagementPage";
import CandidateReviewPage from "./pages/organization/CandidateReviewPage";
import CandidateComparisonPage from "./pages/organization/CandidateComparisonPage";
import OrganizationProfilePage from "./pages/organization/OrganizationProfilePage";
import OrganizationAnalytics from "./pages/organization/OrganizationAnalytics";
import BrowseResumesPage from "./pages/organization/BrowseResumesPage";
import ApplicationDetailPage from "./pages/organization/ApplicationDetailPage";
import HiringPipelinePage from "./pages/organization/HiringPipelinePage";

import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import JobListingsPage from "./pages/candidate/JobListingsPage";
import ApplicationTrackingPage from "./pages/candidate/ApplicationTrackingPage";
import CandidateProfilePage from "./pages/candidate/CandidateProfilePage";
import CandidateAnalytics from "./pages/candidate/CandidateAnalytics";
import MyCommunitiesPage from "./pages/candidate/MyCommunitiesPage";
import ApplicationAnalysis from "./pages/organization/ApplicationAnalysis";
import TalentPoolPage from "./pages/organization/TalentPoolPage";
import SentOffersPage from "./pages/organization/SentOffersPage";
import JobOffersPage from "./pages/candidate/JobOffersPage";
import FeedPage from "./pages/FeedPage";

import PublicCandidateProfile from "./pages/PublicCandidateProfile";
import PublicOrganizationProfile from "./pages/PublicOrganizationProfile";
import VacancyDetailPage from "./pages/VacancyDetailPage";
import PublicJobDetailPage from "./pages/PublicJobDetailPage";
import BrowseJobsPage from "./pages/BrowseJobsPage";
import ChatTestPage from "./pages/ChatTestPage";
import ChatPage from "./pages/ChatPage";

import ProfileSetupModal from "./components/ProfileSetupModal";
import LoadingScreen from "./components/LoadingScreen";
import GlobalIncomingCallNotification from "./components/GlobalIncomingCallNotification";

/* ---------------- ROOT ---------------- */

function RootComponent() {
  const { user, loginStatus } = useAuth();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = Boolean(user);

  if (loginStatus === "logging-in" && !user) {
    return <LoadingScreen />;
  }
  // Wait for profile to load before rendering anything for authenticated users
  if (isAuthenticated && (profileLoading || !isFetched)) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <ProfileSetupModal />
      <GlobalIncomingCallNotification />
      <Outlet />
    </>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

/* ---------------- ROUTES ---------------- */

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  validateSearch: (search) => ({
    redirect: search.redirect || null,
  }),
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const registerOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register/organization",
  component: RegisterOrganizationPage,
});

const registerCandidateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register/candidate",
  component: RegisterCandidatePage,
});

const verifyOTPRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-otp",
  component: VerifyOTPPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
  validateSearch: (search) => ({
    email: search.email || "",
  }),
});

const orgDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/dashboard",
  component: OrganizationDashboard,
});

const postVacancyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/post-vacancy",
  component: PostVacancyPage,
});

const vacancyManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/vacancies",
  component: VacancyManagementPage,
});

const candidateReviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/candidates",
  component: CandidateReviewPage,
});

const candidateComparisonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/compare",
  component: CandidateComparisonPage,
  validateSearch: (search) => ({
    vacancy: search.vacancy || null,
    candidates: search.candidates || "",
  }),
});

const orgProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/profile",
  component: OrganizationProfilePage,
});

const orgAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/analytics",
  component: OrganizationAnalytics,
});

const browseResumesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/resumes",
  component: BrowseResumesPage,
});

const talentPoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/talent-pool",
  component: TalentPoolPage,
});

const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/applications/$slug",
  component: ApplicationDetailPage,
});

const hiringPipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/pipeline",
  component: HiringPipelinePage,
});

const sentOffersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organization/offers",
  component: SentOffersPage,
});

const candidateDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/dashboard",
  component: CandidateDashboard,
});

const jobListingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/jobs",
  component: JobListingsPage,
});

const applicationTrackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/applications",
  component: ApplicationTrackingPage,
});

const candidateProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/profile",
  component: CandidateProfilePage,
});

const candidateAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/analytics",
  component: CandidateAnalytics,
});

const myCommunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/communities",
  component: MyCommunitiesPage,
});

const jobOffersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/candidate/offers",
  component: JobOffersPage,
});

const publicCandidateProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/public/candidate/$slug",
  component: PublicCandidateProfile,
});

const publicOrganizationProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/public/organization/$slug",
  component: PublicOrganizationProfile,
});

const vacancyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vacancy/$slug",
  component: VacancyDetailPage,
});

const publicJobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs/$slug",
  component: PublicJobDetailPage,
});

const browseJobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/browse-jobs",
  component: BrowseJobsPage,
});

const applicationAnalysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/$slug/analysis",
  component: ApplicationAnalysis,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchResultsPage,
  validateSearch: (search) => ({
    q: search.q || "",
  }),
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: NotificationsPage,
});

const chatTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat-test",
  component: ChatTestPage,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat",
  component: ChatPage,
  validateSearch: (search) => ({
    conversation: search.conversation || null,
  }),
});

const documentationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/documentation",
  component: DocumentationPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPolicyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsOfServicePage,
});

const cookiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cookies",
  component: CookieSettingsPage,
});

const accessibilityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accessibility",
  component: AccessibilityPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: FeedPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  registerOrgRoute,
  registerCandidateRoute,
  verifyOTPRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  orgDashboardRoute,
  postVacancyRoute,
  vacancyManagementRoute,
  candidateReviewRoute,
  candidateComparisonRoute,
  orgProfileRoute,
  orgAnalyticsRoute,
  browseResumesRoute,
  talentPoolRoute,
  applicationDetailRoute,
  hiringPipelineRoute,
  sentOffersRoute,
  candidateDashboardRoute,
  jobListingsRoute,
  applicationTrackingRoute,
  candidateProfileRoute,
  candidateAnalyticsRoute,
  myCommunitiesRoute,
  jobOffersRoute,
  publicCandidateProfileRoute,
  publicOrganizationProfileRoute,
  vacancyDetailRoute,
  publicJobDetailRoute,
  browseJobsRoute,
  applicationAnalysisRoute,
  searchRoute,
  notificationsRoute,
  chatTestRoute,
  chatRoute,
  documentationRoute,
  privacyRoute,
  termsRoute,
  cookiesRoute,
  accessibilityRoute,
  settingsRoute,
  feedRoute,
]);

const router = createRouter({ routeTree });

/* ---------------- APP ---------------- */

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
