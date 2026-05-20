import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../../hooks/usePageTitle';

import {
  useGetCallerUserProfile,
  useGetOrganizationProfile,
  useGetVacanciesByOrganization,
  useGetOrganizationAnalytics,
} from '../../hooks/useQueries';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import {
  Briefcase,
  TrendingUp,
  Plus,
  Eye,
  Clock,
  Users,
  CheckCircle,
  BarChart3,
  MapPin,
} from 'lucide-react';

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

export default function OrganizationDashboard() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Dashboard');

  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const organizationId =
    userProfile?.userType === 'organization'
      ? userProfile.entityId
      : null;

  const { data: orgProfile, isLoading: orgLoading } =
    useGetOrganizationProfile(organizationId);

  const { data: vacancies = [], isLoading: vacanciesLoading } =
    useGetVacanciesByOrganization(organizationId);

  const { data: analytics, isLoading: analyticsLoading } = 
    useGetOrganizationAnalytics();

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== 'organization') {
      navigate({ to: '/' });
    }
  }, [profileLoading, userProfile, navigate]);

  const openVacancies = vacancies.filter(v => v.status === 'open');
  const closedVacancies = vacancies.filter(v => v.status === 'closed');

  if (profileLoading || orgLoading || vacanciesLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
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

  const { applications, metrics } = analytics || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-4">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">Hiring Overview</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome, {orgProfile?.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage your vacancies and review candidates with precision analytics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/organization/analytics' })}
              className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
            >
              Export Reports
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/organization/pipeline' })}
              className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 w-full sm:w-auto"
            >
              🗂 Hiring Pipeline
            </Button>
            <Button
              onClick={() => navigate({ to: '/organization/post-vacancy' })}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Post New Vacancy
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Applications</p>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {applications?.total?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +{applications?.pending || 0}% this month
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Users className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Open Vacancies</p>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {openVacancies.length}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {closedVacancies.length} closing soon this month
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Briefcase className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shortlisted</p>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {applications?.shortlisted || 0}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +5% this month
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Quick Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Browse Resumes Card */}
          <Card className="border-none bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-purple-100 text-sm font-medium mb-2">Sorted Applications</p>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1">Browse Resumes</h3>
                  <p className="text-purple-100 text-sm">View applications sorted by vacancy and AI match score</p>
                </div>
                <Button
                  onClick={() => navigate({ to: '/organization/resumes' })}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-medium px-6 w-full sm:w-auto whitespace-nowrap"
                >
                  View Resumes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Post Vacancy Card */}
          <Card className="border-none bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm font-medium mb-2">Quick Action</p>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1">New Talent Source?</h3>
                  <p className="text-blue-100 text-sm">Start recruiting top candidates today</p>
                </div>
                <Button
                  onClick={() => navigate({ to: '/organization/post-vacancy' })}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6 w-full sm:w-auto whitespace-nowrap"
                >
                  Post Vacancy Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 overflow-hidden">

          {/* Applications by Status - Pie Chart */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Applications by Status</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Visual distribution of your current pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {applications?.by_status?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applications.by_status}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {applications.by_status.map((item, idx) => (
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
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No applications yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Trends - Line Chart */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Application Trends</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Monthly volume (Last 6 months)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-gray-700 dark:text-gray-300">Active</Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {applications?.timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={applications.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      fill="url(#colorApplications)"
                    />
                    <defs>
                      <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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

        {/* Featured Tool Banner */}
        <Card className="mb-8 border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 overflow-hidden">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Featured Tool
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Unlock Deep Recruitment Insights
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Go beyond basic numbers. Get comprehensive reports on candidate diversity, time-to-hire metrics, and sourcing efficiency to optimize your budget.
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: '/organization/analytics' })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 w-full sm:w-auto whitespace-nowrap"
              >
                View Deep Analytics →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Vacancies */}
        <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex-1">
              <CardTitle className="text-gray-900 dark:text-white mb-2">Recent Vacancies</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Overview of your most recent job postings and their status.
              </CardDescription>
            </div>
            <Button
              variant="link"
              onClick={() => navigate({ to: '/organization/vacancies' })}
              className="text-blue-600 dark:text-blue-400 self-start sm:self-auto"
            >
              View All Postings
            </Button>
          </CardHeader>

          <CardContent className="pt-6">
            {vacancies.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No vacancies yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by posting your first job vacancy
                </p>
                <Button
                  onClick={() => navigate({ to: '/organization/post-vacancy' })}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Post Vacancy
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {vacancies.slice(0, 3).map(v => (
                  <div
                    key={v.id}
                    onClick={() => navigate({ to: `/vacancy/${v.slug}` })}
                    className="border-b border-gray-200 dark:border-gray-800 last:border-0 pb-6 last:pb-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-6 px-6 py-4 transition-colors rounded-lg"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {v.title}
                          </h3>
                          <Badge 
                            variant={v.status === 'open' ? 'default' : 'secondary'}
                            className={v.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                          >
                            {v.status}
                          </Badge>
                          {v.is_public && (
                            <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                              Public
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {v.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {v.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{v.location}</span>
                            </span>
                          )}
                          {v.experience_level && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3 flex-shrink-0" />
                              {v.experience_level}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Posted {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {vacancies.length > 3 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing 3 of {vacancies.length} active listings
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
}
