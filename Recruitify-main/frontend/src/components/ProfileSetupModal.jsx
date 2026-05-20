import { useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { AlertTriangle } from "lucide-react";

// Routes always accessible without profile completion
const EXEMPT_PREFIXES = [
  "/login", "/register", "/verify-otp", "/forgot-password", "/reset-password",
  "/public/", "/vacancy/", "/jobs/", "/candidate/profile", "/organization/profile",
];

function isExempt(pathname) {
  if (pathname === "/") return true;
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function isProfileComplete(userProfile) {
  if (!userProfile) return true; // not logged in, not our problem

  if (userProfile.userType === "candidate") {
    const c = userProfile.candidate;
    if (!c) return false;
    const hasName = c.name && c.name.trim().length > 0;
    const hasPhone = c.phone && c.phone.trim().length > 0;
    return !!(hasName && hasPhone);
  }

  if (userProfile.userType === "organization") {
    const o = userProfile.organization;
    if (!o) return false;
    const hasName = o.name && o.name.trim().length > 0;
    const hasPhone = o.phone && o.phone.trim().length > 0;
    const hasEmail = o.contact_email && o.contact_email.trim().length > 0;
    return !!(hasName && hasPhone && hasEmail);
  }

  return true;
}

export default function ProfileSetupModal() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const pathname = location.pathname;
  const exempt = isExempt(pathname);
  const complete = isProfileComplete(userProfile);
  const shouldRedirect = !!userProfile && !isLoading && !exempt && !complete;

  useEffect(() => {
    if (!shouldRedirect) return;
    const to =
      userProfile?.userType === "organization"
        ? "/organization/profile"
        : "/candidate/profile";
    navigate({ to });
  }, [shouldRedirect, userProfile?.userType, navigate]);

  // Show warning banner on the profile page itself
  const onProfilePage =
    pathname.startsWith("/candidate/profile") ||
    pathname.startsWith("/organization/profile");

  if (!!userProfile && !isLoading && onProfilePage && !complete) {
    const isOrg = userProfile?.userType === "organization";
    return (
      <div className="bg-amber-500 text-white px-4 py-3 text-sm flex items-center gap-2 justify-center">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>Profile incomplete.</strong>{" "}
          {isOrg
            ? "Organization name, contact email, and phone number are required before you can continue."
            : "Your name and phone number are required before you can continue."}
        </span>
      </div>
    );
  }

  return null;
}
