import { useEffect, useState } from "react";
import { useNavigate, Link, useSearch } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  useGetCallerUserProfile,
  useGetVacanciesByOrganization,
  useGetVacancyApplications,
  useUpdateApplicationStatus,
} from "../../hooks/useQueries";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, FileText, GitCompare, Search, Filter, MoreVertical } from "lucide-react";
import { fixMediaUrl } from "@/lib/api";

export default function CandidateReviewPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/organization/candidates' });
  usePageTitle('Review Candidates');

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const updateApplicationStatus = useUpdateApplicationStatus();

  const organizationId = userProfile?.userType === "organization" ? userProfile.entityId : null;
  const { data: vacancies = [], isLoading: vacanciesLoading } = useGetVacanciesByOrganization(organizationId);

  const [selectedVacancySlug, setSelectedVacancySlug] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: applications = [], isLoading: applicationsLoading } = useGetVacancyApplications(selectedVacancySlug);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "organization") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  useEffect(() => {
    if (vacancies.length > 0 && !selectedVacancySlug) {
      // If vacancy ID is in URL search params, use that
      if (search?.vacancy) {
        setSelectedVacancySlug(search.vacancy);
      } else {
        setSelectedVacancySlug(vacancies[0].slug);
      }
    }
  }, [vacancies, selectedVacancySlug, search]);

  useEffect(() => {
    setSelectedCandidates([]);
  }, [selectedVacancySlug]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedVacancySlug]);

  const handleUpdateStatus = async (applicationSlug, status) => {
    try {
      await updateApplicationStatus.mutateAsync({ slug: applicationSlug, status });
      toast.success(`Application marked as ${status}`);
    } catch (error) {
      toast.error(error?.message || "Failed to update application");
    }
  };

  const handleToggleCandidate = (appId) => {
    setSelectedCandidates(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleCompareSelected = () => {
    if (selectedCandidates.length < 2) {
      toast.error("Please select at least 2 candidates to compare");
      return;
    }
    // Navigate to comparison page
    navigate({ 
      to: "/organization/compare",
      search: {
        vacancy: selectedVacancySlug,
        candidates: selectedCandidates.join(',')
      }
    });
  };

  if (vacanciesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-64" />
        </main>
        <Footer />
      </div>
    );
  }

  const selectedVacancy = vacancies.find(v => v.slug === selectedVacancySlug);
  
  // Filter applications
  const realApplications = applications.filter(app => !app.is_self_test);
  const newApps = realApplications.filter(app => app.status === 'applied');
  const reviewingApps = realApplications.filter(app => app.status === 'reviewing');
  const shortlistedApps = realApplications.filter(app => app.status === 'shortlisted');
  const hiredApps = realApplications.filter(app => app.status === 'hired');
  const rejectedApps = realApplications.filter(app => app.status === 'rejected');

  const getFilteredApplications = () => {
    let filtered = realApplications;
    
    if (activeTab === "new") filtered = newApps;
    else if (activeTab === "shortlisted") filtered = shortlistedApps;
    else if (activeTab === "hired") filtered = hiredApps;
    else if (activeTab === "rejected") filtered = rejectedApps;
    
    if (searchQuery) {
      filtered = filtered.filter(app => 
        app.candidate_details?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.final_score?.toString().includes(searchQuery)
      );
    }
    
    return filtered.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  };

  const filteredApplications = getFilteredApplications();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Review Candidates
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <Select
              value={selectedVacancySlug || ''}
              onValueChange={(v) => setSelectedVacancySlug(v)}
            >
              <SelectTrigger className="w-full sm:w-96 text-base font-medium border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a vacancy" />
              </SelectTrigger>
              <SelectContent>
                {vacancies.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>
                    {v.title} ({v.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVacancy && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>{realApplications.length} Total Applicants • {newApps.length} New</span>
              </div>
            )}
            {selectedCandidates.length > 0 && (
              <Button onClick={handleCompareSelected} className="bg-blue-600 hover:bg-blue-700 text-white">
                <GitCompare className="mr-2 h-4 w-4" />
                Compare ({selectedCandidates.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">New</div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{newApps.length}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Reviewing</div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{reviewingApps.length}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Shortlisted</div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{shortlistedApps.length}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 sm:p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Hired</div>
              <div className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">{hiredApps.length}</div>
            </CardContent>
          </Card>
        </div>



        {/* Tabs and Search */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full lg:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                All Applicants
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                New
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                Shortlisted
              </TabsTrigger>
              <TabsTrigger value="hired" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                Hired
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                Rejected
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by name, skill, or score..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-80"
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
              </button>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Candidate Feed Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Candidate Feed</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{filteredApplications.length} results</span>
              </div>
              <Select defaultValue="highest">
                <SelectTrigger className="w-full sm:w-48 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="highest">Sort by: Highest Score</SelectItem>
                  <SelectItem value="lowest">Sort by: Lowest Score</SelectItem>
                  <SelectItem value="recent">Sort by: Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Candidate List */}
            {applicationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No applications found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paginatedApplications.map((app) => (
                  <Card key={app.id} className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                        {/* Mobile: Top row with checkbox, avatar, name */}
                        <div className="flex items-center gap-3 lg:gap-4">
                          <Checkbox
                            checked={selectedCandidates.includes(app.id)}
                            onCheckedChange={() => handleToggleCandidate(app.id)}
                            className="shrink-0"
                          />
                          
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                            {app.candidate_details?.name?.charAt(0) || '?'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/public/candidate/${app.candidate_details?.slug || app.candidate_details?.id}`}
                              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                            >
                              {app.candidate_details?.name}
                            </Link>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {selectedVacancy?.title}
                            </p>
                          </div>
                        </div>

                        {/* Desktop: Stats in row, Mobile: Stats in grid */}
                        <div className="grid grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-4 lg:flex-1">
                          <div className="text-center lg:min-w-[120px]">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Match Score</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{width: `${app.final_score || 0}%`}}
                                ></div>
                              </div>
                              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{app.final_score?.toFixed(1)}%</span>
                            </div>
                          </div>

                          <div className="text-center lg:min-w-[100px]">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Applied</div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>

                          <div className="text-center lg:min-w-[100px]">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</div>
                            <Badge variant={
                              app.status === 'hired' ? 'default' :
                              app.status === 'shortlisted' ? 'default' :
                              app.status === 'interview_scheduled' ? 'default' :
                              app.status === 'interview_completed' ? 'default' :
                              app.status === 'reviewing' ? 'secondary' :
                              app.status === 'rejected' ? 'destructive' :
                              'outline'
                            } className={`
                              ${app.status === 'hired' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                              ${app.status === 'shortlisted' ? 'bg-blue-600 text-white' : ''}
                              ${app.status === 'interview_scheduled' ? 'bg-purple-600 text-white' : ''}
                              ${app.status === 'interview_completed' ? 'bg-indigo-600 text-white' : ''}
                              ${app.status === 'reviewing' ? 'bg-yellow-600 text-white' : ''}
                              ${app.status === 'rejected' ? 'bg-red-600 text-white' : ''}
                              ${app.status === 'applied' ? 'bg-gray-600 dark:bg-gray-700 text-white' : ''}
                            `}>
                              {app.status === 'interview_scheduled' ? 'Interview Scheduled' :
                               app.status === 'interview_completed' ? 'Interview Completed' :
                               app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                          <button
                            onClick={() => navigate({ to: `/organization/applications/${app.slug}` })}
                            className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
                          >
                            View Details
                          </button>
                          {app.candidate_details?.resume_url && (
                            <button
                              onClick={() => window.open(fixMediaUrl(app.candidate_details.resume_url), "_blank")}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
                              title="Resume"
                            >
                              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate({ to: `/applications/${app.slug}/analysis` })}
                            className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Analysis →
                          </button>
                          
                          {/* Show different buttons based on status */}
                          {app.status === 'shortlisted' ? (
                            <button 
                              onClick={() => handleUpdateStatus(app.slug, 'hired')}
                              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
                            >
                              Hire
                            </button>
                          ) : app.status === 'hired' ? (
                            <span className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg whitespace-nowrap">
                              ✓ Hired
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleUpdateStatus(app.slug, 'shortlisted')}
                              disabled={app.status === 'rejected'}
                              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Shortlist
                            </button>
                          )}
                          
                          {app.status !== 'hired' && (
                            <button 
                              onClick={() => handleUpdateStatus(app.slug, 'rejected')}
                              disabled={app.status === 'rejected'}
                              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredApplications.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white' 
                          : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                    <button 
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages} ({filteredApplications.length} total)
                </span>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </main>

      <Footer />
    </div>
  );
}
