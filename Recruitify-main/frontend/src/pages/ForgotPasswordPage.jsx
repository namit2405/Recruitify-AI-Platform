import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../hooks/useAuth";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "../lib/api";

export default function ForgotPasswordPage() {
  usePageTitle('Forgot Password');
  
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!profileLoading && user && userProfile) {
      if (userProfile.userType === "organization") {
        navigate({ to: "/organization/dashboard" });
      } else if (userProfile.userType === "candidate") {
        navigate({ to: "/candidate/dashboard" });
      }
    }
  }, [user, userProfile, profileLoading, navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchApi("/auth/password-reset/request/", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      toast.success("Reset code sent! Check your email.");
      navigate({ 
        to: "/reset-password", 
        search: { email: email.trim() } 
      });
    } catch (err) {
      const msg = err?.detail || err?.message || "Failed to send reset code";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900 mb-4">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email and we'll send you a reset code
            </p>
          </div>

          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isLoading}
                    className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-5 w-5" />
                      Send Reset Code
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  onClick={() => navigate({ to: "/login" })}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
