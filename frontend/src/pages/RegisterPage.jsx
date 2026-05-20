import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "../hooks/useAuth";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Building2, UserPlus, Briefcase, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  usePageTitle('Register');
  
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && user && userProfile) {
      if (userProfile.userType === "organization") {
        navigate({ to: "/organization/dashboard" });
      } else if (userProfile.userType === "candidate") {
        navigate({ to: "/candidate/dashboard" });
      }
    }
  }, [user, userProfile, profileLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <img src="/images/Page, Features-dark.png" alt="Recruitify" className="hidden dark:block h-24 w-auto" />
              <img src="/images/Page-light.png" alt="Recruitify" className="block dark:hidden h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Join Recruitify
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose how you want to get started
            </p>
          </div>

          {/* Registration Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Organization Card */}
            <Card 
              className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group shadow-sm"
              onClick={() => navigate({ to: "/register/organization" })}
            >
              <CardContent className="p-8 bg-white dark:bg-gray-800">
                <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  I'm an Employer
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Post jobs, find talented candidates, and build your dream team with AI-powered matching.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>
                    </div>
                    <span>Post unlimited job openings</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>
                    </div>
                    <span>AI-powered candidate screening</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>
                    </div>
                    <span>Browse candidate resumes</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs">✓</span>
                    </div>
                    <span>Analytics and insights</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                  onClick={() => navigate({ to: "/register/organization" })}
                >
                  Register as Employer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Candidate Card */}
            <Card 
              className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer group shadow-sm"
              onClick={() => navigate({ to: "/register/candidate" })}
            >
              <CardContent className="p-8 bg-white dark:bg-gray-800">
                <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UserPlus className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  I'm a Job Seeker
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Find your dream job, showcase your skills, and connect with top employers.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </div>
                    <span>Browse thousands of jobs</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </div>
                    <span>AI-powered job matching</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </div>
                    <span>Track your applications</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    </div>
                    <span>Build your professional profile</span>
                  </li>
                </ul>

                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                  onClick={() => navigate({ to: "/register/candidate" })}
                >
                  Register as Candidate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={() => navigate({ to: "/login" })}
              >
                Sign In
              </Button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
