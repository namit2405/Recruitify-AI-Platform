import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { usePageTitle } from '../hooks/usePageTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin, Briefcase, Clock, Building2, ArrowRight,
  LogIn, Sparkles, Search, IndianRupee,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchPublicJobs() {
  const res = await fetch(`${API_BASE}/vacancies/public/`, {
    headers: { 'ngrok-skip-browser-warning': '1' },
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

function JobCard({ vacancy, onApply }) {
  const navigate = useNavigate();

  const skills = (vacancy.required_skills || []).slice(0, 3);
  const postedDate = vacancy.created_at
    ? new Date(vacancy.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 p-6 flex flex-col gap-4 cursor-pointer"
      onClick={() => navigate({ to: `/jobs/${vacancy.slug}` })}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {vacancy.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {vacancy.organization?.name || 'Company'}
          </p>
        </div>
        {postedDate && (
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {postedDate}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        {vacancy.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-blue-400" />
            {vacancy.location}
          </span>
        )}
        {vacancy.experience_level && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 text-purple-400" />
            {vacancy.experience_level}
          </span>
        )}
        {vacancy.salary_range && (
          <span className="flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5 text-green-400" />
            {vacancy.salary_range}
          </span>
        )}
      </div>

      {/* Description */}
      {vacancy.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {vacancy.description}
        </p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-xs bg-blue-50 text-blue-700 border-0 font-medium"
            >
              {skill}
            </Badge>
          ))}
          {(vacancy.required_skills || []).length > 3 && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500 border-0">
              +{vacancy.required_skills.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={(e) => { e.stopPropagation(); onApply(vacancy); }}
        className="w-full mt-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold group/btn"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Login to Apply
        <ArrowRight className="ml-auto h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
}

export default function BrowseJobsPage() {
  usePageTitle('Browse Jobs');
  const navigate = useNavigate();

  const { data: jobs = [], isLoading, isError } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: fetchPublicJobs,
    staleTime: 60_000,
  });

  const handleApply = (vacancy) => {
    // Redirect to login with a redirect back to the public job detail
    navigate({ to: '/login', search: { redirect: `/jobs/${vacancy.slug}` } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      {/* Hero banner */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-sm font-medium mb-5">
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Loading...' : `${jobs.length} Open Positions`}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Browse Open Jobs
          </h1>
          <p className="text-blue-200/70 text-lg max-w-xl mx-auto mb-8">
            Explore the latest opportunities from top companies. Log in to apply in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate({ to: '/login' })}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-xl font-semibold shadow-lg shadow-blue-500/25"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Log In to Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/register/candidate' })}
              className="border-white/20 text-white hover:bg-white/10 px-8 py-5 rounded-xl font-semibold"
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </section>

      {/* Jobs grid */}
      <main className="flex-1 container mx-auto px-4 py-12">
        {isError && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Could not load jobs right now. Please try again later.</p>
          </div>
        )}

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && !isError && jobs.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No open positions right now. Check back soon!</p>
          </div>
        )}

        {!isLoading && !isError && jobs.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Openings
                <span className="ml-2 text-base font-normal text-gray-400 dark:text-gray-500">({jobs.length} jobs)</span>
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate({ to: '/register/candidate' })}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Sign up for more
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} vacancy={job} onApply={handleApply} />
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to land your next role?</h3>
          <p className="text-blue-100 mb-6">Create a free account and apply to any job in seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate({ to: '/register/candidate' })}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-5 rounded-xl"
            >
              Get Started — It's Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/login' })}
              className="border-white/40 text-white hover:bg-white/10 px-8 py-5 rounded-xl"
            >
              Already have an account? Log In
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
