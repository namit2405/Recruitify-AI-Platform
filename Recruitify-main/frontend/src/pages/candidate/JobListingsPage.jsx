import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetActiveVacancies,
  useApplyForVacancy,
  useGetCandidateProfile,
  useUploadResume,
  useUpdateCandidateProfile,
  useGetCandidateApplications,
} from "../../hooks/useQueries";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  Loader2,
  Lock,
  CheckCircle,
} from "lucide-react";

export default function JobListingsPage() {
  const navigate = useNavigate();
  
  usePageTitle('Browse Jobs');

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: vacancies = [], isLoading: vacanciesLoading } = useGetActiveVacancies();
  const { data: applications = [] } = useGetCandidateApplications();

  const applyForVacancy = useApplyForVacancy();
  const uploadResume = useUploadResume();
  const updateProfile = useUpdateCandidateProfile();

  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [pendingResumeFile, setPendingResumeFile] = useState(null); // file just uploaded, not yet in profile
  const [showSaveToProfile, setShowSaveToProfile] = useState(false); // prompt to save resume to profile

  const candidateId = userProfile?.userType === "candidate" ? userProfile.entityId : null;
  const { data: candidateProfile } = useGetCandidateProfile(candidateId);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  const handleApply = async () => {
    if (!candidateId || !selectedVacancy) {
      toast.error("Unable to apply");
      return;
    }

    // Check resume: either already in profile or just uploaded in this dialog
    if (!candidateProfile?.resume_url && !pendingResumeFile) {
      toast.error("Please upload your resume in PDF format before applying.");
      return;
    }

    if (!selectedVacancy.is_public && !passcode.trim()) {
      toast.error("Please enter the passcode for this private vacancy");
      return;
    }

    try {
      const payload = { vacancyId: selectedVacancy.id };
      if (!selectedVacancy.is_public) payload.passcode = passcode.trim();

      await applyForVacancy.mutateAsync(payload);

      toast.success("Application submitted successfully!");
      setShowApplyDialog(false);
      setSelectedVacancy(null);
      setPasscode("");
      setPendingResumeFile(null);
      setShowSaveToProfile(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit application");
    }
  };

  const handleSaveResumeToProfile = async () => {
    if (!pendingResumeFile || !candidateId) return;
    try {
      await updateProfile.mutateAsync({
        candidateId,
        name: candidateProfile?.name || "",
        phone: candidateProfile?.phone || "",
      });
      toast.success("Resume saved to your profile.");
    } catch {
      toast.error("Could not save resume to profile.");
    }
    setShowSaveToProfile(false);
  };

  if (vacanciesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Browse Jobs</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover opportunities that match your skills and preferences
            </p>
          </div>

          {/* Job Listings */}
          {vacancies.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No jobs available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for new opportunities
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {vacancies.map((vacancy) => {
                const hasApplied = applications.some(app => app.vacancy === vacancy.id);
                
                return (
                  <div
                    key={vacancy?.id?.toString() || Math.random().toString()}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover-lift animate-fade-in relative overflow-hidden"
                  >
                    {/* Gradient accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    {/* Job Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {vacancy?.title}
                          {!vacancy?.is_public && (
                            <Lock className="h-4 w-4 text-amber-500" />
                          )}
                        </h3>
                        {vacancy?.experience_level && (
                          <Badge variant="outline" className="shrink-0 border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                            {vacancy.experience_level}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {vacancy?.description}
                      </p>

                      {vacancy?.organization && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Posted by{" "}
                          <Link
                            to={`/public/organization/${vacancy.organization.slug}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {vacancy.organization.name}
                          </Link>
                        </p>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {vacancy?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            {vacancy.location}
                          </span>
                        )}
                        {vacancy?.salary_range && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4 text-green-500" />
                            {vacancy.salary_range}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 text-purple-500" />
                        Posted {vacancy?.created_at && new Date(vacancy.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
                        variant="outline"
                        className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        View Details
                      </Button>
                      
                      {hasApplied ? (
                        <Button
                          disabled
                          variant="outline"
                          className="flex-1 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Already Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedVacancy(vacancy);
                            setShowApplyDialog(true);
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                        >
                          Apply Now
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for {selectedVacancy?.title}</DialogTitle>
            <DialogDescription>
              Confirm your application for this position
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedVacancy?.is_public && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Private Vacancy</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This is a private job posting. Please enter the passcode provided by the organization.
                    </p>
                  </div>
                </div>
              </div>
            )}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your profile information will be submitted with this application.
              </p>

            {!selectedVacancy?.is_public && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Passcode *</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character passcode"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-lg tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the passcode shared by the organization
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Resume (PDF only)</p>
              {candidateProfile?.resume_url ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✓ Resume from your profile will be submitted
                  </p>
                </div>
              ) : pendingResumeFile ? (
                <div className="space-y-2">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      ✓ {pendingResumeFile.name} — ready to submit
                    </p>
                  </div>
                  {showSaveToProfile && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        Save this resume to your profile for future applications?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveResumeToProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Yes, save it
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowSaveToProfile(false)}>
                          No thanks
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                        toast.error("Only PDF files are allowed.");
                        return;
                      }
                      try {
                        await uploadResume.mutateAsync(file);
                        setPendingResumeFile(file);
                        setShowSaveToProfile(true);
                        toast.success("Resume uploaded successfully.");
                      } catch (error) {
                        const backendMessage = error?.body?.detail || error?.message;
                        toast.error(backendMessage || "Failed to upload resume. Please try again.");
                      }
                    }}
                    disabled={uploadResume.isPending}
                    className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload your resume in PDF format to continue.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApply}
                disabled={applyForVacancy.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {applyForVacancy.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm Application"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowApplyDialog(false);
                  setSelectedVacancy(null);
                  setPasscode("");
                  setPendingResumeFile(null);
                  setShowSaveToProfile(false);
                }}
                disabled={applyForVacancy.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
