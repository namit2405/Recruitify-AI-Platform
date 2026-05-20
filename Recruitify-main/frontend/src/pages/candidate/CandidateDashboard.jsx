import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetCandidateProfile,
  useGetCandidateApplications,
  useGetActiveVacancies,
  useGetCandidateAnalytics,
  useSmartJobRecommendations,
} from "../../hooks/useQueries";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProfileStrengthCard from "../../components/ProfileStrengthCard";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  MapPin,
  BarChart3,
  Sparkles,
} from "lucide-react";

import {
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS = {
  applied: '#3b82f6',
  reviewing: '#f59e0b',
  shortlisted: '#10b981',
  rejected: '#ef4444',
  hired: '#8b5cf6',
};

export default function CandidateDashboard() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Dashboard');
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const candidateId =
    userProfile?.userType === "candidate" ? userProfile.entityId : null;

  const { data: candidateProfile, isLoading: candidateLoading } =
    useGetCandidateProfile(candidateId);

  const { data: applications = [], isLoading: applicationsLoading } =
    useGetCandidateApplications(candidateId);

  const { data: activeVacancies = [], isLoading: vacanciesLoading } =
    useGetActiveVacancies();

  const { data: analytics, isLoading: analyticsLoading } = 
    useGetCandidateAnalytics();

  const { data: smartJobs = [] } = useSmartJobRecommendations();

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  const pendingApplications = applications.filter(
    (a) => a.status === "applied" || a.status === "reviewing"
  );
  const shortlistedApplications = applications.filter(
    (a) => a.status === "shortlisted"
  );
  const acceptedApplications = applications.filter(
    (a) => a.status === "hired"
  );

  if (candidateLoading || applicationsLoading || vacanciesLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 to-green-600/5">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const successRate = applications.length > 0 
    ? Math.round(((shortlistedApplications.length + acceptedApplications.length) / applications.length) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {candidateProfile?.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your applications, refine your search, and land your next big role.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/candidate/applications' })}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Clock className="mr-2 h-4 w-4" />
            Schedule View
          </Button>
          <Button
            onClick={() => navigate({ to: '/candidate/analytics' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Growth Insights
          </Button>
        </div>

        {/* Stats Cards + Profile Strength */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  +12% this week
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Total Applications
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {applications.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {pendingApplications.length} currently pending review
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Shortlisted
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {shortlistedApplications.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {acceptedApplications.length} active interview stages
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Available Jobs
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {activeVacancies.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Matches for your skill set
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Success Rate
                </p>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {successRate}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Based on response frequency
                </p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Profile Strength */}
        <div className="mb-8">
          <ProfileStrengthCard />
        </div>

        {/* Charts - Only 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          
          {/* Application Status Distribution */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Application Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Current visual breakdown of your active application pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.applications?.by_status?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.applications.by_status}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {analytics.applications.by_status.map((item, idx) => (
                        <Cell
                          key={idx}
                          fill={STATUS_COLORS[item.status] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-4">No applications yet</p>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => navigate({ to: '/candidate/jobs' })}
                    >
                      Browse Jobs
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Application Activity</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Frequency of submissions over the last 6 months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.applications?.timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.applications.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      fill="url(#colorActivity)"
                    />
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Featured Analytics Banner */}
        <Card className="mb-8 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="p-4 bg-green-600 rounded-xl flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Deep Dive into Detailed Analytics
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                    Unlock comprehensive insights into your job search performance, recruiter engagement metrics, and peer comparison data.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate({ to: '/candidate/analytics' })}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 w-full md:w-auto flex-shrink-0"
              >
                View Detailed Report →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Smart Job Recommendations */}
        {smartJobs.length > 0 && (
          <Card className="mb-8 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-start justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Recommended for You
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Jobs ranked by how well they match your skills
                </CardDescription>
              </div>
              <Button variant="link" onClick={() => navigate({ to: '/candidate/jobs' })} className="text-blue-600 dark:text-blue-400">
                Browse All →
              </Button>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {smartJobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate({ to: `/vacancy/${job.slug}` })}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-3 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{job.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${job.match_score}%`,
                            backgroundColor: job.match_score >= 70 ? '#10B981' : job.match_score >= 40 ? '#F59E0B' : '#94a3b8'
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{job.match_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Applications & Featured Opportunities */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recent Applications */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-start justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-gray-900 dark:text-white">Recent Applications</CardTitle>
                  {applications.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      {applications.filter(a => a.status === 'applied' || a.status === 'reviewing').length} New
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Track your latest submissions
                </CardDescription>
              </div>
              <Button
                variant="link"
                onClick={() => navigate({ to: '/candidate/applications' })}
                className="text-blue-600 dark:text-blue-400"
              >
                View All →
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate({ to: '/candidate/applications' })}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-1">
                        <Briefcase className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          {app.vacancy_title || 'Job Application'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {app.organization_name || 'Company'}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">•</span>
                          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          app.status === 'applied' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' :
                          app.status === 'reviewing' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                          app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                          app.status === 'hired' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                          'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Opportunities — jobs not yet applied to */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-start justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-gray-900 dark:text-white">Featured Opportunities</CardTitle>
                  {(() => {
                    const unapplied = activeVacancies.filter(v => !applications.some(a => a.vacancy === v.id));
                    return unapplied.length > 0 ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                        {unapplied.length} New
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Jobs you haven't applied to yet
                </CardDescription>
              </div>
              <Button
                variant="link"
                onClick={() => navigate({ to: '/candidate/jobs' })}
                className="text-blue-600 dark:text-blue-400"
              >
                Browse More →
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {(() => {
                const unapplied = activeVacancies.filter(v => !applications.some(a => a.vacancy === v.id));
                return unapplied.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-3">You've applied to all available jobs</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate({ to: '/candidate/jobs' })}>
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                <div className="space-y-4">
                  {unapplied.slice(0, 5).map((vacancy) => (
                    <div
                      key={vacancy.id}
                      onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mt-1">
                        <Briefcase className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {vacancy.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                          {vacancy.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {vacancy.location}
                            </span>
                          )}
                          {vacancy.experience_level && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                                {vacancy.experience_level}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/vacancy/${vacancy.slug}` });
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
                );
              })()}
            </CardContent>
          </Card>

        </div>

      </main>

      <Footer />
    </div>
  );
}
