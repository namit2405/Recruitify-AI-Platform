import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OTPInput from "../components/OTPInput";
import { fetchApi } from "@/lib/api";
import { useAuth } from "../hooks/useAuth";

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  usePageTitle('Verify OTP');
  
  const { user, setUser } = useAuth();
  const search = useSearch({ from: "/verify-otp" });
  
  const email = search.email || "";
  const purpose = search.purpose || "registration";
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect if already logged in (only check on mount)
  useEffect(() => {
    if (user && localStorage.getItem("access_token")) {
      // User is already authenticated, redirect them
      if (user.user_type === "organization") {
        navigate({ to: "/organization/dashboard" });
      } else if (user.user_type === "candidate") {
        navigate({ to: "/candidate/dashboard" });
      }
    }
  }, []); // Empty dependency array - only run once on mount

  if (!email) {
    navigate({ to: "/login" });
    return null;
  }

  const handleOTPComplete = async (otpCode) => {
    setIsVerifying(true);
    
    try {
      const endpoint = purpose === "registration" 
        ? "/auth/register/verify-otp/"
        : "/auth/login/verify-otp/";
      
      const response = await fetchApi(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, otp_code: otpCode }),
      });

      if (response.access && response.refresh) {
        localStorage.setItem("access_token", response.access);
        localStorage.setItem("refresh_token", response.refresh);
        setUser(response.user);
        
        toast.success(purpose === "registration" ? "Email verified successfully!" : "Login successful!");
        
        if (response.user.user_type === "organization") {
          navigate({ to: "/organization/dashboard" });
        } else {
          navigate({ to: "/candidate/dashboard" });
        }
      }
    } catch (error) {
      const msg = error?.body?.detail || "Verification failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      await fetchApi("/auth/resend-otp/", {
        method: "POST",
        body: JSON.stringify({ email, purpose }),
      });
      
      toast.success("Verification code sent!");
    } catch (error) {
      const msg = error?.body?.detail || "Failed to resend code";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/images/Page, Features-dark.png" alt="Recruitify" className="hidden dark:block h-24 w-auto" />
              <img src="/images/Page-light.png" alt="Recruitify" className="block dark:hidden h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {purpose === "registration" ? "Verify Your Email" : "Two-Factor Authentication"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {purpose === "registration" 
                ? `We've sent a 6-digit code to`
                : `Enter the verification code sent to`
              }
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
              {email}
            </p>
          </div>

          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <OTPInput
                length={6}
                onComplete={handleOTPComplete}
                onResend={handleResend}
                isLoading={isVerifying || isResending}
              />

              {isVerifying && (
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying your code...
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                  Didn't receive the code?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button
              variant="link"
              onClick={() => navigate({ to: "/login" })}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            For security reasons, this code will expire in 10 minutes
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
