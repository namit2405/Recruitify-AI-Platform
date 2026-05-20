import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  useGetCallerUserProfile,
  useGetCandidateApplications,
} from "../../hooks/useQueries";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  FileText, 
  Clock, 
  Search, 
  MessageSquare, 
  ExternalLink,
  Briefcase,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function ApplicationTrackingPage() {
  const navigate = useNavigate();
  
  usePageTitle('My Applications');
  
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const candidateId = userProfile?.userType === "candidate" ? userProfile.entityId : null;
  const { data: applications = [], isLoading: applicationsLoading } = useGetCandidateApplications(candidateId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Calculate stats - fix to match actual status values
  const stats = {
    active: applications.filter(app => 
      app.status === 'pending' || 
      app.status === 'applied' || 
      app.status === 'under_review' || 
      app.status === 'reviewing'
    ).length,
    interviews: applications.filter(app => 
      app.status === 'shortlisted' || 
      app.status === 'interview_scheduled' || 
      app.status === 'interview_completed'
    ).length,
    offers: applications.filter(app => app.status === 'hired').length,
    responseRate: applications.length > 0 
      ? Math.round((applications.filter(app => 
          app.status !== 'pending' && app.status !== 'applied'
        ).length / applications.length) * 100)
      : 0
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.vacancy_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Fix status filter logic to match actual status values
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "applied" && (app.status === "pending" || app.status === "applied")) ||
                         (statusFilter === "interviewing" && (app.status === "shortlisted" || app.status === "interview_scheduled" || app.status === "interview_completed" || app.status === "under_review" || app.status === "reviewing")) ||
                         (statusFilter === "offers" && app.status === "hired") ||
                         (statusFilter === "closed" && (app.status === "rejected" || app.status === "withdrawn"));
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Applied", color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm" },
      applied: { label: "Applied", color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm" },
      under_review: { label: "Under Review", color: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-sm" },
      reviewing: { label: "Under Review", color: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-sm" },
      shortlisted: { label: "Shortlisted", color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm" },
      interview_scheduled: { label: "Interview Scheduled", color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm" },
      interview_completed: { label: "Interview Completed", color: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm" },
      hired: { label: "Hired", color: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm" },
      rejected: { label: "Rejected", color: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm" },
      withdrawn: { label: "Withdrawn", color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  if (applicationsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
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
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Applications</h1>
              {candidateId && (
                <span className="text-sm text-gray-500 dark:text-gray-400">Candidate ID: #{candidateId}</span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and track the progress of your active job applications. Connect with recruiters and stay updated on your career journey.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Active</span>
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Interviews</span>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.interviews}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Offers</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.offers}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Response Rate</span>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.responseRate}%</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, company, or status..."
                  className="pl-10 border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "applied" ? "default" : "outline"}
                  onClick={() => setStatusFilter("applied")}
                  className={statusFilter === "applied" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  size="sm"
                >
                  Applied
                </Button>
                <Button
                  variant={statusFilter === "interviewing" ? "default" : "outline"}
                  onClick={() => setStatusFilter("interviewing")}
                  className={statusFilter === "interviewing" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  size="sm"
                >
                  Interviewing
                </Button>
                <Button
                  variant={statusFilter === "offers" ? "default" : "outline"}
                  onClick={() => setStatusFilter("offers")}
                  className={statusFilter === "offers" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  size="sm"
                >
                  Offers
                </Button>
                <Button
                  variant={statusFilter === "closed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("closed")}
                  className={statusFilter === "closed" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}
                  size="sm"
                >
                  Closed
                </Button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              LISTING {filteredApplications.length} APPLICATION{filteredApplications.length !== 1 ? 'S' : ''}
              {applications.length > 0 && (
                <span className="ml-2">* Showing applications from the last 90 days</span>
              )}
            </p>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {applications.length === 0 ? "No applications yet" : "No matching applications"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {applications.length === 0 
                  ? "Start applying to jobs to see your applications here"
                  : "Try adjusting your search or filters"}
              </p>
              {applications.length === 0 && (
                <Button
                  onClick={() => navigate({ to: "/candidate/jobs" })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Jobs
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application.id?.toString() ?? `vacancy-${application.vacancy ?? "unknown"}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Application Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {application.vacancy_title || `Vacancy #${application.vacancy}`}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {application.organization_name && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4 flex-shrink-0" />
                            <Link
                              to={`/public/organization/${application.organization_slug}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {application.organization_name}
                            </Link>
                          </span>
                        )}
                        
                        {application.applied_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>Applied: {new Date(application.applied_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</span>
                          </span>
                        )}
                      </div>

                      {application.candidate_details && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Applicant:{" "}
                          <span className="font-medium">{application.candidate_details.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      Last updated {application.updated_at 
                        ? new Date(application.updated_at).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>

                  {/* Application Details */}
                  {application.feedback && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Feedback:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{application.feedback}</p>
                    </div>
                  )}

                  {/* Application Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      {application.matchScore !== undefined && application.matchScore !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Match Score:</span>
                          <Badge variant="outline" className="font-semibold text-gray-900 dark:text-white">
                            {application.matchScore}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ 
                          to: "/chat", 
                          search: { conversation: application.organization_id } 
                        })}
                        className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ to: `/vacancy/${application.vacancy_slug}` })}
                        className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        View Details
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
