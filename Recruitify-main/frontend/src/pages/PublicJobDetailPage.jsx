import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  MapPin,
  IndianRupee,
  Briefcase,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  GraduationCap,
  Tag,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export default function PublicJobDetailPage() {
  const { slug } = useParams({ from: "/jobs/$slug" });
  const navigate = useNavigate();

  usePageTitle("Job Details");

  const { data: userProfile } = useGetCallerUserProfile();

  const { data: vacancy, isLoading, error } = useQuery({
    queryKey: ["public-vacancy", slug],
    queryFn: () => fetchApi(`/vacancies/${slug}/public/`),
    retry: false,
  });

  const handleApply = () => {
    if (!userProfile) {
      navigate({ to: "/login", search: { redirect: `/jobs/${slug}` } });
      return;
    }
    if (userProfile.userType !== "candidate") {
      toast.error("Only candidates can apply for jobs");
      return;
    }
    // Logged in candidate — go to the full vacancy detail page to apply
    navigate({ to: `/vacancy/${vacancy?.slug}` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-48 mb-4" />
          <Skeleton className="h-48" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !vacancy) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This job posting may have been closed or removed.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="bg-blue-600 hover:bg-blue-700">
              Go Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {vacancy.title}
              </h1>
              {vacancy.organization?.name && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    onClick={() =>
                      vacancy.organization?.slug &&
                      navigate({ to: `/public/organization/${vacancy.organization.slug}` })
                    }
                  >
                    {vacancy.organization.name}
                  </span>
                </div>
              )}
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 px-3 py-1 flex-shrink-0">
              Open
            </Badge>
            {!vacancy.is_public && (
              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 px-3 py-1 flex-shrink-0 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Calendar className="h-4 w-4" />
            <span>
              Posted {new Date(vacancy.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Apply CTA */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              size="lg"
            >
              {!userProfile ? "Login to Apply" : "Apply Now"}
            </Button>
            {!userProfile && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate({ to: "/register", search: { redirect: `/jobs/${slug}` } })}
                className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              >
                Create Account
              </Button>
            )}
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {vacancy.location && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{vacancy.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {vacancy.salary_range && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <IndianRupee className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Salary</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{vacancy.salary_range}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {vacancy.experience_level && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{vacancy.experience_level}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {(vacancy.min_experience_years != null) && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min. Years</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {vacancy.min_experience_years}
                      {vacancy.max_experience_years ? `–${vacancy.max_experience_years}` : "+"} yrs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {vacancy.description}
                </p>
              </CardContent>
            </Card>

            {/* Benefits */}
            {vacancy.benefits && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benefits</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {vacancy.benefits}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Skills */}
            {vacancy.required_skills?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.required_skills.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {vacancy.education_required?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    Education Required
                  </h2>
                  <ul className="space-y-1">
                    {vacancy.education_required.map((edu, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Keywords */}
            {vacancy.keywords?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" />
                    Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Apply CTA Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Interested in this role?
                </h3>
                {!vacancy.is_public && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                    <Lock className="h-3 w-3 flex-shrink-0" />
                    This is a private vacancy. You'll need a passcode from the employer to apply.
                  </p>
                )}
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                  {!userProfile
                    ? "Create a free account or log in to apply."
                    : "Click Apply Now to submit your application."}
                </p>
                <Button
                  onClick={handleApply}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {!userProfile ? "Login to Apply" : "Apply Now"}
                </Button>
                {!userProfile && (
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    onClick={() => navigate({ to: "/register" })}
                  >
                    Register Free
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
