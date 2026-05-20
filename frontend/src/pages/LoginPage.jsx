import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { usePageTitle } from "../hooks/usePageTitle";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loader2, LogIn, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  usePageTitle('Login');
  
  const { login, user, loginStatus } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const search = useSearch({ from: '/login' });
  const redirectTo = search?.redirect || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && user && userProfile) {
      if (redirectTo) {
        navigate({ to: redirectTo });
        return;
      }
      if (userProfile.userType === "organization") {
        navigate({ to: "/organization/dashboard" });
      } else if (userProfile.userType === "candidate") {
        navigate({ to: "/candidate/dashboard" });
      }
    }
  }, [user, userProfile, profileLoading, navigate, redirectTo]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    try {
      const result = await login(email.trim(), password);
      
      if (result?.requires_mfa) {
        toast.info("Verification code sent to your email");
        navigate({ 
          to: "/verify-otp", 
          search: { email: result.email, purpose: "login" } 
        });
        return;
      }
      
      toast.success("Signed in successfully");
    } catch (err) {
      const msg = err?.body?.detail || (typeof err?.body === "object" && err.body !== null ? JSON.stringify(err.body) : err?.message) || "Login failed";
      toast.error(msg);
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/images/Page, Features-dark.png" alt="Recruitify" className="hidden dark:block h-24 w-auto" />
              <img src="/images/Page-light.png" alt="Recruitify" className="block dark:hidden h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue to Recruitify
            </p>
          </div>

          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 dark:text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={isLoggingIn}
                    className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-900 dark:text-white">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      onClick={() => navigate({ to: "/forgot-password" })}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoggingIn}
                    className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                  />
                </div>

                <Button
                  type="submit"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  size="lg"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => navigate({ to: "/register" })}
                  >
                    Create Account
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
