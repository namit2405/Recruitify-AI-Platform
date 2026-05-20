import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";
import { useGetCallerUserProfile, useApplyForVacancy, useGetCandidateApplications, useSkillGap } from "../hooks/useQueries";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecommendedCandidates from "../components/RecommendedCandidates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  Calendar,
  Users,
  Edit,
  Bell,
  XCircle,
  CheckCircle,
  Building2,
  Clock,
  Copy,
  Lock,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VacancyDetailPage() {
  const { id: slug } = useParams({ from: "/vacancy/$slug" });
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Job Details');
  
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: applications = [] } = useGetCandidateApplications();
  const applyForVacancy = useApplyForVacancy();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyPasscode, setApplyPasscode] = useState("");
  const [selfTestDialogOpen, setSelfTestDialogOpen] = useState(false);
  const [selfTestFile, setSelfTestFile] = useState(null);
  const [selfTestResult, setSelfTestResult] = useState(null);
  const [selfTestLoading, setSelfTestLoading] = useState(false);

  // Fetch vacancy details
  const { data: vacancy, isLoading } = useQuery({
    queryKey: ["vacancy", slug],
    queryFn: () => fetchApi(`/vacancies/${slug}/`),
  });

  // Fetch applications for this vacancy (if organization)
  const { data: orgApplications = [] } = useQuery({
    queryKey: ["vacancy-applications", slug],
    queryFn: async () => {
      const allApps = await fetchApi('/applications/');
      return allApps.filter(app => app.vacancy_slug === slug || app.vacancy === vacancy?.id);
    },
    enabled: userProfile?.userType === 'organization' && !!vacancy,
  });

  const hasApplied = applications.some(app => app.vacancy_slug === slug || app.vacancy === vacancy?.id);

  // Skill gap — only for candidates who haven't applied yet
  const isCandidate = userProfile?.userType === 'candidate';
  const { data: skillGap } = useSkillGap(isCandidate && !hasApplied ? slug : null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    required_skills: [],
    location: '',
    salary_range: '',
    experience_level: '',
    benefits: '',
    status: 'open',
    is_public: true,
  });

  const [notifyMessage, setNotifyMessage] = useState('');

  // Update vacancy mutation
  const updateVacancy = useMutation({
    mutationFn: async (data) => {
      return fetchApi(`/vacancies/${slug}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacancy', slug] });
      queryClient.invalidateQueries({ queryKey: ['vacancies'] });
      setEditDialogOpen(false);
      toast.success('Vacancy updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update vacancy');
    },
  });

  // Notify candidates mutation
  const notifyCandidates = useMutation({
    mutationFn: async (message) => {
      // This would be a backend endpoint to send notifications
      return fetchApi(`/vacancies/${slug}/notify/`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      setNotifyDialogOpen(false);
      setNotifyMessage('');
      toast.success('Candidates notified successfully');
    },
    onError: () => {
      toast.error('Failed to notify candidates');
    },
  });

  const handleEdit = () => {
    if (vacancy) {
      setEditForm({
        title: vacancy.title,
        description: vacancy.description,
        required_skills: Array.isArray(vacancy.required_skills) ? vacancy.required_skills : [],
        location: vacancy.location || '',
        salary_range: vacancy.salary_range || '',
        experience_level: vacancy.experience_level || '',
        benefits: vacancy.benefits || '',
        status: vacancy.status,
        is_public: vacancy.is_public !== undefined ? vacancy.is_public : true,
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    updateVacancy.mutate(editForm);
  };

  const handleNotify = () => {
    if (notifyMessage.trim()) {
      notifyCandidates.mutate(notifyMessage);
    }
  };

  const handleCloseVacancy = () => {
    if (confirm('Are you sure you want to close this vacancy? Candidates will be notified.')) {
      updateVacancy.mutate({ status: 'closed' });
    }
  };

  const handleSelfTest = async () => {
    if (!selfTestFile) {
      toast.error("Please select a resume file");
      return;
    }

    setSelfTestLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selfTestFile);

      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://tag-committee-appliance-obtain.trycloudflare.com';
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/vacancies/${slug}/self-test/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to run self-test');
      }

      const result = await response.json();
      setSelfTestResult(result);
      toast.success('Self-test completed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to run self-test');
    } finally {
      setSelfTestLoading(false);
    }
  };

  const handleDownloadResumes = async () => {
    try {
      toast.info('Preparing download...');
      const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://tag-committee-appliance-obtain.trycloudflare.com';
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/vacancies/${slug}/download-resumes/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to download resumes');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'resumes.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Resumes downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download resumes');
    }
  };

  const handleApply = async () => {
    if (!vacancy) {
      toast.error("Vacancy information not available");
      return;
    }

    // Check if private vacancy requires passcode
    if (!vacancy.is_public && !applyPasscode.trim()) {
      toast.error("Please enter the passcode for this private vacancy");
      return;
    }

    try {
      const payload = {
        vacancySlug: slug,
      };
      
      // Add passcode if it's a private vacancy
      if (!vacancy.is_public) {
        payload.passcode = applyPasscode.trim();
      }

      await applyForVacancy.mutateAsync(payload);
      toast.success('Application submitted successfully!');
      setApplyDialogOpen(false);
      setApplyPasscode("");
      queryClient.invalidateQueries({ queryKey: ['candidate-applications'] });
    } catch (error) {
      toast.error(error?.message || 'Failed to submit application');
    }
  };

  const isOrganization = userProfile?.userType === 'organization';
  const isOwner = isOrganization && vacancy?.organization?.id === userProfile?.entityId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 mb-4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Vacancy not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-4 sm:py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Back Button */}
          <button
            onClick={() => navigate({ to: '/organization/vacancies' })}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Vacancy List
          </button>

          {/* Header Section - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            {/* Title and Organization Info */}
            <div className="mb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">{vacancy.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400">
                {vacancy.organization?.name && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span>{vacancy.organization.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Posted on {new Date(vacancy.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Organization - Mobile Optimized */}
            {isOwner && (
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    className={
                      vacancy.status === 'open'
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 px-4 py-1.5"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0 px-4 py-1.5"
                    }
                  >
                    {vacancy.status === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1.5 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    {vacancy.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white w-full sm:w-auto"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Dialog open={selfTestDialogOpen} onOpenChange={(open) => {
                    setSelfTestDialogOpen(open);
                    if (!open) {
                      setSelfTestResult(null);
                      setSelfTestFile(null);
                      setSelfTestLoading(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white w-full sm:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        Self Test
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Self Test Resume</DialogTitle>
                        <DialogDescription>
                          Upload a test resume to see how the ML scoring works for this vacancy
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {!selfTestResult ? (
                          <>
                            <div>
                              <Label>Upload Resume (PDF)</Label>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setSelfTestFile(e.target.files?.[0] || null)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload a PDF resume to test the ML scoring system
                              </p>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setSelfTestDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleSelfTest}
                                disabled={!selfTestFile || selfTestLoading}
                              >
                                {selfTestLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Running Test...
                                  </>
                                ) : (
                                  'Run Test'
                                )}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-green-900">Test Completed!</p>
                                <p className="text-xs text-green-700 mt-1">
                                  Self Test #{selfTestResult.test_number}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground">Score</p>
                                  <p className="text-2xl font-bold">{selfTestResult.final_score?.toFixed(2)}%</p>
                                </div>
                                <div className="border rounded-lg p-3">
                                  <p className="text-xs text-muted-foreground">Category</p>
                                  <Badge className="mt-1">{selfTestResult.category}</Badge>
                                </div>
                              </div>

                              {selfTestResult.ml_result && (
                                <div className="border rounded-lg p-3 max-h-96 overflow-y-auto">
                                  <p className="text-sm font-medium mb-2">AI Analysis</p>
                                  {typeof selfTestResult.ml_result === 'string' ? (
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                      {selfTestResult.ml_result}
                                    </p>
                                  ) : (
                                    <div className="space-y-3 text-xs">
                                      {selfTestResult.ml_result.fit_summary && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Summary</p>
                                          <p className="text-muted-foreground">{selfTestResult.ml_result.fit_summary}</p>
                                        </div>
                                      )}
                                      
                                      {selfTestResult.ml_result.recommendation && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Recommendation</p>
                                          <Badge variant={
                                            selfTestResult.ml_result.recommendation.includes('Strongly') ? 'default' :
                                            selfTestResult.ml_result.recommendation.includes('Consider') ? 'secondary' :
                                            'outline'
                                          }>
                                            {selfTestResult.ml_result.recommendation}
                                          </Badge>
                                        </div>
                                      )}
                                      
                                      {selfTestResult.ml_result.strengths && selfTestResult.ml_result.strengths.length > 0 && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Strengths</p>
                                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {selfTestResult.ml_result.strengths.map((strength, idx) => (
                                              <li key={idx}>{strength}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {selfTestResult.ml_result.weaknesses && selfTestResult.ml_result.weaknesses.length > 0 && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Weaknesses</p>
                                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {selfTestResult.ml_result.weaknesses.map((weakness, idx) => (
                                              <li key={idx}>{weakness}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                        <div>
                                          <p className="text-muted-foreground">Skill Match</p>
                                          <p className="font-medium">{selfTestResult.ml_result.skill_match_pct}%</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Experience</p>
                                          <p className="font-medium">{selfTestResult.ml_result.experience_years} years</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button 
                                onClick={() => {
                                  setSelfTestResult(null);
                                  setSelfTestFile(null);
                                  setSelfTestLoading(false);
                                }}
                              >
                                Test Another
                              </Button>
                              <Button 
                                onClick={() => {
                                  setSelfTestDialogOpen(false);
                                  setSelfTestResult(null);
                                  setSelfTestFile(null);
                                  setSelfTestLoading(false);
                                  queryClient.invalidateQueries({ queryKey: ['vacancy-applications', slug] });
                                }}
                              >
                                Done
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadResumes}
                    disabled={orgApplications.length === 0}
                    className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Resumes
                  </Button>
                  
                  <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white w-full sm:w-auto">
                        <Bell className="mr-2 h-4 w-4" />
                        Notify Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Notify Candidates</DialogTitle>
                        <DialogDescription>
                          Send a notification to all candidates who applied for this position
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Message</Label>
                          <Textarea
                            value={notifyMessage}
                            onChange={(e) => setNotifyMessage(e.target.value)}
                            placeholder="Enter your message to candidates..."
                            rows={4}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleNotify}
                            disabled={!notifyMessage.trim() || notifyCandidates.isPending}
                          >
                            {notifyCandidates.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Notification'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {vacancy.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseVacancy}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 w-full sm:w-auto col-span-2 sm:col-span-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Close Vacancy
                    </Button>
                  )}

                  {/* Share link — available for all vacancies */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = `${window.location.origin}/jobs/${vacancy.slug}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Share link copied to clipboard!');
                    }}
                    className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 w-full sm:w-auto col-span-2 sm:col-span-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Key Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
            {vacancy.location && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Location</p>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white break-words">{vacancy.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {vacancy.salary_range && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                      <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Salary Range</p>
                      <p className="font-semibold text-gray-900 dark:text-white break-words">{vacancy.salary_range}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {vacancy.experience_level && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Experience</p>
                      <p className="font-semibold text-gray-900 dark:text-white break-words">{vacancy.experience_level}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Applications</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{isOwner ? orgApplications.length : vacancy.application_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6 w-full">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              
              {/* Description */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                    {vacancy.description}
                  </p>
                </CardContent>
              </Card>

              {/* Requirements */}
              {vacancy.required_skills && Array.isArray(vacancy.required_skills) && vacancy.required_skills.length > 0 && (
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Required Skills</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">Core competencies and technical requirements for this role.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {vacancy.required_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg min-w-0">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white font-medium break-words overflow-wrap-anywhere">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skill Gap Analysis — candidates only, before applying */}
              {skillGap && skillGap.required_skills?.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                      🎯 Your Skill Match
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Based on your profile — {skillGap.match_percentage}% match
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{
                          width: `${skillGap.match_percentage}%`,
                          backgroundColor: skillGap.match_percentage >= 70 ? '#10B981' : skillGap.match_percentage >= 40 ? '#F59E0B' : '#EF4444'
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skillGap.matched_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-green-800 dark:text-green-300 font-medium">{skill}</span>
                        </div>
                      ))}
                      {skillGap.missing_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                          <span className="text-sm text-red-700 dark:text-red-300 font-medium">{skill}</span>
                        </div>
                      ))}
                    </div>
                    {skillGap.missing_skills.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Add the missing skills to your profile to improve your match score.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              {vacancy.benefits && vacancy.benefits.trim() && (
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">Company Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                      {vacancy.benefits}
                    </p>
                  </CardContent>
                </Card>
              )}

            </div>

            {/* Right Column - Actions & Info */}
            <div className="space-y-6 min-w-0">
              
              {/* Recommended Candidates for Organization */}
              {isOwner && <RecommendedCandidates vacancySlug={slug} />}
              
              {/* Applications Overview for Organization */}
              {isOwner && (
                <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-white">Applications Overview</CardTitle>
                    <CardDescription className="text-blue-100">
                      {orgApplications.length} candidate{orgApplications.length !== 1 ? 's have' : ' has'} already applied for this position.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium"
                      onClick={() => navigate({ to: '/organization/candidates' })}
                    >
                      View Applications
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Apply Card for Candidates */}
              {!isOrganization && (
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">Apply for this position</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {vacancy.status === 'open' 
                        ? 'Submit your application now' 
                        : 'This position is currently closed'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {hasApplied ? (
                      <Button 
                        className="w-full text-gray-900 dark:text-white"
                        variant="outline"
                        disabled
                      >
                        Already Applied
                      </Button>
                    ) : vacancy.status === 'open' ? (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        onClick={() => setApplyDialogOpen(true)}
                      >
                        Apply Now
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        Position Closed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Additional Info */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Visibility
                    </div>
                    <Badge variant="outline" className="ml-auto text-gray-900 dark:text-white">
                      {vacancy.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      Posted Date
                    </div>
                    <span className="ml-auto text-gray-900 dark:text-white font-medium">
                      {new Date(vacancy.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  {isOwner && !vacancy.is_public && vacancy.passcode && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Passcode for private access</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded font-mono font-bold text-gray-900 dark:text-white">
                          {vacancy.passcode}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(vacancy.passcode);
                            toast.success("Passcode copied!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:w-[900px] max-h-[90vh] overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-800">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Edit Vacancy</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Manage the details for <span className="text-blue-600 dark:text-blue-400 font-medium">{vacancy?.title}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            
            {/* Core Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Core Information
                </h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Job Title</Label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    placeholder="e.g. Senior Web Developer"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Detailed Description</Label>
                    <span className="text-xs text-gray-400">Rich Editor</span>
                  </div>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={5}
                    placeholder="We are looking for a highly skilled Senior Web Developer to join our growing product team..."
                    className="resize-none w-full"
                  />
                </div>
              </div>
            </div>

            {/* Logistics & Comp Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-800">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Logistics & Comp
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Working Location
                  </Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                    placeholder="Jalandhar, Punjab (Remote Friendly)"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Salary Range (Annual)
                  </Label>
                  <Input
                    value={editForm.salary_range}
                    onChange={(e) => setEditForm({...editForm, salary_range: e.target.value})}
                    placeholder="₹15,00,000 - ₹24,00,000"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                    Required Seniority
                  </Label>
                  <Select
                    value={editForm.experience_level}
                    onValueChange={(value) => setEditForm({...editForm, experience_level: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Senior Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Current Status
                  </Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({...editForm, status: value})}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open - Active Hiring</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Skills & Requirements Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Skills & Requirements
                </h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Skill Stack (Line-separated)
                  </Label>
                  <Textarea
                    value={Array.isArray(editForm.required_skills) ? editForm.required_skills.join('\n') : ''}
                    onChange={(e) => setEditForm({
                      ...editForm, 
                      required_skills: e.target.value.split('\n').filter(r => r.trim())
                    })}
                    rows={6}
                    placeholder="React.js (v18+)&#10;TypeScript (Advanced)&#10;Tailwind CSS&#10;Redux Toolkit&#10;Jest & React Testing Library (Strength)&#10;RESTful API Integration"
                    className="resize-none w-full font-mono text-sm bg-white dark:bg-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Skills will be displayed as interactive badges on the public portal.
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Benefits & Perks
                  </Label>
                  <Textarea
                    value={editForm.benefits}
                    onChange={(e) => setEditForm({
                      ...editForm, 
                      benefits: e.target.value
                    })}
                    rows={4}
                    placeholder="1. Full health insurance coverage&#10;2. Remote work flexibility&#10;3. Annual learning and development budget&#10;4. Modern workspace and top-tier hardware"
                    className="resize-none w-full bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Publication Settings Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-6">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Publication Settings
                </h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Public Careers Page Visibility</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        Toggling this on will sync this vacancy to your company's career portal and LinkedIn integration. Candidates will be able to apply directly through our secured portal.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      {editForm.is_public ? 'Public' : 'Private'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_public}
                        onChange={(e) => setEditForm({...editForm, is_public: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800 mt-6">
            <Button 
              variant="ghost" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Delete Vacancy
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Discard Changes
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateVacancy.isPending || !editForm.title || !editForm.description}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {updateVacancy.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Update Vacancy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {vacancy?.title}</DialogTitle>
            <DialogDescription>
              Confirm your application for this position
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {vacancy && !vacancy.is_public && (
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

            <p className="text-sm text-muted-foreground">
              Your profile information and resume will be submitted with this application.
            </p>

            {vacancy && !vacancy.is_public && (
              <div className="space-y-2">
                <Label>Passcode *</Label>
                <Input
                  type="text"
                  value={applyPasscode}
                  onChange={(e) => setApplyPasscode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character passcode"
                  maxLength={6}
                  className="font-mono text-lg tracking-wider uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the passcode shared by the organization
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)} className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleApply}
                disabled={applyForVacancy.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {applyForVacancy.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Application'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
