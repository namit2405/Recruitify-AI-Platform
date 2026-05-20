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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Briefcase, FileText, TrendingUp, Clock, CheckCircle,
  MapPin, BarChart3, Sparkles,
} from "lucide-react";

import {
  PieChart, Pie, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
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
  usePageTitle('Dashboard');

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const candidateId = userProfile?.userType === "candidate" ? userProfile.entityId : null;
  const { data: candidateProfile, isLoading: candidateLoading } = useGetCandidateProfile(candidateId);
  const { data: applications = [], isLoading: applicationsLoading } = useGetCandidateApplications(candidateId);
  const { data: activeVacancies = [], isLoading: vacanciesLoading } = useGetActiveVacancies();
  const { data: analytics, isLoading: analyticsLoading } = useGetCandidateAnalytics();
  const { data: smartJobs = [] } = useSmartJobRecommendations();

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") navigate({ to: "/" });
  }, [userProfile, profileLoading, navigate]);

  const pendingApplications = applications.filter(a => a.status === "applied" || a.status === "reviewing");
  const shortlistedApplications = applications.filter(a => a.status === "shortlisted");
  const acceptedApplications = applications.filter(a => a.status === "hired");
  const successRate = applications.length > 0
    ? Math.round(((shortlistedApplications.length + acceptedApplications.length) / applications.length) * 100)
    : 0;

  if (candidateLoading || applicationsLoading || vacanciesLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid md:grid-cols-4 gap-4 mb-5">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-5 space-y-5">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            Welcome back, {candidateProfile?.name}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your applications, refine your search, and land your next big role.
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/candidate/applications' })}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              <Clock className="mr-1.5 h-3.5 w-3.5" /> Schedule View
            </Button>
            <Button size="sm" onClick={() => navigate({ to: '/candidate/analytics' })}
              className="bg-blue-600 hover:bg-blue-700 text-white">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Growth Insights
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FileText, color: "blue", label: "Total Applications", value: applications.length, sub: `${pendingApplications.length} pending review`, badge: "+12% this week" },
            { icon: CheckCircle, color: "blue", label: "Shortlisted", value: shortlistedApplications.length, sub: `${acceptedApplications.length} active interview stages` },
            { icon: Briefcase, color: "green", label: "Available Jobs", value: activeVacancies.length, sub: "Matches for your skill set" },
            { icon: TrendingUp, color: "orange", label: "Success Rate", value: `${successRate}%`, sub: "Based on response frequency" },
          ].map(({ icon: Icon, color, label, value, sub, badge }) => (
            <Card key={label} className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                    <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
                  </div>
                  {badge && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">{badge}</Badge>}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Strength */}
        <ProfileStrengthCard />

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Application Status</CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Current visual breakdown of your active application pipeline.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {analytics?.applications?.by_status?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={analytics.applications.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={75} label={({ status, count }) => `${status}: ${count}`}>
                      {analytics.applications.by_status.map((item, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[item.status] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <FileText className="h-9 w-9 mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-2">No applications yet</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate({ to: '/candidate/jobs' })}>Browse Jobs</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Application Activity</CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Frequency of submissions over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {analytics?.applications?.timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.applications.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="h-9 w-9 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No data available yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Banner — compact inline */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-green-600 rounded-lg flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Deep Dive into Detailed Analytics</span>
              <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 ml-2">— Unlock insights into your job search performance and peer comparison data.</span>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate({ to: '/candidate/analytics' })} className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0">
            View Detailed Report →
          </Button>
        </div>

        {/* Smart Recommendations + Recent Applications + Featured Opportunities */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* Recommendations */}
          {smartJobs.length > 0 && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-500" /> Recommended for You
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Jobs ranked by how well they match your skills</CardDescription>
                </div>
                <Button variant="link" size="sm" onClick={() => navigate({ to: '/candidate/jobs' })} className="text-blue-600 dark:text-blue-400 h-auto p-0 text-xs">Browse All →</Button>
              </CardHeader>
              <CardContent className="px-4 py-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {smartJobs.slice(0, 5).map((job) => (
                    <div key={job.id} onClick={() => navigate({ to: `/vacancy/${job.slug}` })}
                      className="flex items-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 cursor-pointer transition-colors">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                        <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-gray-900 dark:text-white truncate">{job.title}</h4>
                        {job.location && <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{job.location}</span>}
                      </div>
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color: job.match_score >= 70 ? '#10B981' : job.match_score >= 40 ? '#F59E0B' : '#94a3b8' }}>
                        {job.match_score}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Recent Applications</CardTitle>
                  {applications.filter(a => a.status === 'applied' || a.status === 'reviewing').length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 text-[10px]">
                      {applications.filter(a => a.status === 'applied' || a.status === 'reviewing').length} New
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Track your latest submissions</CardDescription>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate({ to: '/candidate/applications' })} className="text-blue-600 dark:text-blue-400 h-auto p-0 text-xs">View All →</Button>
            </CardHeader>
            <CardContent className="px-4 py-0">
              {applications.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <FileText className="h-9 w-9 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No applications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} onClick={() => navigate({ to: '/candidate/applications' })}
                      className="flex items-center gap-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 cursor-pointer transition-colors">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                        <Briefcase className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{app.vacancy_title || 'Job Application'}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="truncate">{app.organization_name || 'Company'}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${
                        app.status === 'applied' ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' :
                        app.status === 'reviewing' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                        app.status === 'hired' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">Featured Opportunities</CardTitle>
                  {(() => {
                    const n = activeVacancies.filter(v => !applications.some(a => a.vacancy === v.id)).length;
                    return n > 0 ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">{n} New</Badge> : null;
                  })()}
                </div>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Jobs you haven't applied to yet</CardDescription>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate({ to: '/candidate/jobs' })} className="text-blue-600 dark:text-blue-400 h-auto p-0 text-xs">Browse More →</Button>
            </CardHeader>
            <CardContent className="px-4 py-0">
              {(() => {
                const unapplied = activeVacancies.filter(v => !applications.some(a => a.vacancy === v.id));
                return unapplied.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Briefcase className="h-9 w-9 mx-auto mb-2 opacity-40" />
                    <p className="text-sm mb-2">You've applied to all available jobs</p>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => navigate({ to: '/candidate/jobs' })}>Browse Jobs</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {unapplied.slice(0, 5).map((vacancy) => (
                      <div key={vacancy.id} onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
                        className="flex items-center gap-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 px-4 cursor-pointer transition-colors">
                        <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                          <Briefcase className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{vacancy.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            {vacancy.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{vacancy.location}</span>}
                            {vacancy.experience_level && <><span>·</span><Badge variant="outline" className="text-[10px] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-0 h-4">{vacancy.experience_level}</Badge></>}
                          </div>
                        </div>
                        <Button variant="outline" size="sm"
                          className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 h-7 flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: `/vacancy/${vacancy.slug}` }); }}>
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
