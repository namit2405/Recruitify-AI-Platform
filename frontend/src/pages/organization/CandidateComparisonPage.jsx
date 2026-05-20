import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  useGetCallerUserProfile,
  useGetVacancyApplications,
  useUpdateApplicationStatus,
} from "../../hooks/useQueries";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp
} from "lucide-react";

export default function CandidateComparisonPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/organization/compare" });
  usePageTitle('Compare Candidates');

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const updateApplicationStatus = useUpdateApplicationStatus();

  const vacancySlug = search.vacancy || null;
  const candidateIds = search.candidates ? search.candidates.split(',') : [];

  const { data: applications = [], isLoading: applicationsLoading } = useGetVacancyApplications(vacancySlug);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "organization") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  const selectedApplications = applications.filter(app => candidateIds.includes(app.id));

  const handleFinalizeSelection = () => {
    toast.success("Selection finalized");
    navigate({ to: "/organization/candidates" });
  };

  const handleCancelReview = () => {
    navigate({ to: "/organization/candidates" });
  };

  if (applicationsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (selectedApplications.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No candidates selected for comparison</p>
            <Button onClick={() => navigate({ to: "/organization/candidates" })}>
              Back to Candidates
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const vacancyTitle = selectedApplications[0]?.vacancy_details?.title || "Vacancy";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: "/organization/candidates" })}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Candidate Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comparing {selectedApplications.length} candidates for {vacancyTitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" className="gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-4 w-4" />
            View Timeline
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <CheckCircle className="h-4 w-4" />
            Make Decision
          </Button>
        </div>

        {/* Score Comparison */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Score Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedApplications
              .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
              .map((app, index) => (
                <Card key={app.id} className={`border-2 ${
                  index === 0 
                    ? "border-green-500 shadow-lg" 
                    : "border-gray-200 dark:border-gray-800"
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {app.candidate_details?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {app.candidate_details?.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {vacancyTitle}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge className="bg-green-600 text-white">
                          <Award className="h-3 w-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Match Score</div>
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {app.final_score?.toFixed(1)}%
                        </div>
                        <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${app.final_score || 0}%`}}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <Badge variant={
                          app.status === 'shortlisted' ? 'default' :
                          app.status === 'reviewing' ? 'secondary' :
                          app.status === 'rejected' ? 'destructive' :
                          'outline'
                        }>
                          {app.status}
                        </Badge>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate({ to: `/applications/${app.slug}/analysis` })}
                      >
                        View Full Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Skills Deep-Dive */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Skills Deep-Dive</h2>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="space-y-6">
                {selectedApplications.map((app) => {
                  const mlResult = app.ml_result && typeof app.ml_result === 'object' ? app.ml_result : {};
                  const skillMatch = mlResult.skill_match_pct || 0;
                  const semanticSimilarity = mlResult.semantic_similarity || 0;
                  const experienceYears = mlResult.experience_years || 0;

                  return (
                    <div key={app.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {app.candidate_details?.name?.charAt(0) || '?'}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {app.candidate_details?.name}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {app.final_score?.toFixed(1)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Skills Match</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{skillMatch}%</span>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{width: `${skillMatch}%`}}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Semantic Similarity</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{semanticSimilarity}%</span>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{width: `${semanticSimilarity}%`}}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Experience</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{experienceYears} years</span>
                          </div>
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${Math.min(experienceYears * 10, 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {selectedApplications.map((app) => (
              <Card key={app.id} className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-3">
                      {app.candidate_details?.name?.charAt(0) || '?'}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {app.candidate_details?.name}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {app.candidate_details?.location || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Expected Salary:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {app.candidate_details?.expected_salary || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Notice Period:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {app.candidate_details?.notice_period || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(app.applied_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ready to Proceed */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ready to proceed?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Review the comparison above and make your final decision
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancelReview}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Review
                </Button>
                <Button
                  onClick={handleFinalizeSelection}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Finalize Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
}
