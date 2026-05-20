import { useEffect } from "react";
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
  MapPin, IndianRupee, Briefcase, Calendar, Building2,
  Clock, CheckCircle, GraduationCap, Tag, Lock, Share2,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Social share helpers ─── */
function buildShareUrl(platform, url, title, description) {
  const enc = encodeURIComponent;
  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${enc(`${title}\n${description}\n\n${url}`)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(`${title} — ${description}`)}&via=Recruitify`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`;
    default:
      return '#';
  }
}

const SHARE_PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    bg: 'bg-[#25D366] hover:bg-[#1ebe5d]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    bg: 'bg-[#1877F2] hover:bg-[#0d6efd]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    bg: 'bg-black hover:bg-gray-800',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    bg: 'bg-[#0A66C2] hover:bg-[#0958a8]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

/* ─── Dynamic meta tag injector ─── */
function JobMetaTags({ vacancy, pageUrl }) {
  useEffect(() => {
    if (!vacancy) return;

    const title = `${vacancy.title} at ${vacancy.organization?.name || 'Recruitify'} | Recruitify`;
    const description = vacancy.description
      ? vacancy.description.slice(0, 160).replace(/\n/g, ' ')
      : `Apply for ${vacancy.title} at ${vacancy.organization?.name}. ${vacancy.location ? `Location: ${vacancy.location}.` : ''} ${vacancy.salary_range ? `Salary: ${vacancy.salary_range}.` : ''}`;
    const image = 'https://recruitify.namits.shop/images/hero-homepage.avif';

    const setMeta = (selector, attr, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.match(/\[(.+?)="(.+?)"\]/).slice(1);
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Standard
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content',
      [...(vacancy.required_skills || []), ...(vacancy.keywords || []), 'jobs', 'hiring', 'recruitify'].join(', '));

    // Open Graph
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:site_name"]', 'content', 'Recruitify');

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);
    setMeta('meta[name="twitter:site"]', 'content', '@Recruitify');

    return () => {
      // Restore default title on unmount
      document.title = 'Recruitify';
    };
  }, [vacancy, pageUrl]);

  return null;
}

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

  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://recruitify.namits.shop/jobs/${slug}`;
  const shareTitle = vacancy ? `${vacancy.title} at ${vacancy.organization?.name || 'Recruitify'}` : 'Job Opening';
  const shareDesc = vacancy?.description ? vacancy.description.slice(0, 120) : 'Check out this job on Recruitify!';

  const handleApply = () => {
    if (!userProfile) {
      navigate({ to: "/login", search: { redirect: `/jobs/${slug}` } });
      return;
    }
    if (userProfile.userType !== "candidate") {
      toast.error("Only candidates can apply for jobs");
      return;
    }
    navigate({ to: `/vacancy/${vacancy?.slug}` });
  };

  const handleShare = (platform) => {
    const url = buildShareUrl(platform, pageUrl, shareTitle, shareDesc);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl);
    toast.success('Link copied to clipboard!');
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
            <p className="text-gray-500 dark:text-gray-400 mb-6">This job posting may have been closed or removed.</p>
            <Button onClick={() => navigate({ to: "/" })} className="bg-blue-600 hover:bg-blue-700">Go Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Dynamic meta tags */}
      <JobMetaTags vacancy={vacancy} pageUrl={pageUrl} />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{vacancy.title}</h1>
              {vacancy.organization?.name && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span
                    className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    onClick={() => vacancy.organization?.slug && navigate({ to: `/public/organization/${vacancy.organization.slug}` })}
                  >
                    {vacancy.organization.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 px-3 py-1">Open</Badge>
              {!vacancy.is_public && (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0 px-3 py-1 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Calendar className="h-4 w-4" />
            <span>Posted {new Date(vacancy.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>

          {/* Apply + Share row */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleApply} className="bg-blue-600 hover:bg-blue-700 text-white px-8" size="lg">
              {!userProfile ? "Login to Apply" : "Apply Now"}
            </Button>
            {!userProfile && (
              <Button variant="outline" size="lg" onClick={() => navigate({ to: "/register" })}
                className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                Create Account
              </Button>
            )}

            {/* Share buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-400 flex items-center gap-1 mr-1">
                <Share2 className="h-3.5 w-3.5" /> Share
              </span>
              {SHARE_PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleShare(p.id)}
                  title={`Share on ${p.label}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${p.bg}`}
                >
                  {p.icon}
                </button>
              ))}
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                title="Copy link"
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-transform hover:scale-110"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-gray-600 dark:fill-gray-300">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
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
          {vacancy.min_experience_years != null && (
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Min. Years</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {vacancy.min_experience_years}{vacancy.max_experience_years ? `–${vacancy.max_experience_years}` : '+'} yrs
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
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
              </CardContent>
            </Card>

            {vacancy.benefits && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benefits</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{vacancy.benefits}</p>
                </CardContent>
              </Card>
            )}

            {/* Share section at bottom of main content */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="pt-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-gray-500" />
                  Share this job
                </h2>
                <div className="flex flex-wrap gap-3">
                  {SHARE_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleShare(p.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${p.bg}`}
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy Link
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {vacancy.required_skills?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" /> Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.required_skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-0">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {vacancy.education_required?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" /> Education Required
                  </h2>
                  <ul className="space-y-1">
                    {vacancy.education_required.map((edu, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />{edu}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {vacancy.keywords?.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardContent className="pt-6">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-500" /> Keywords
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{kw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Apply CTA Card */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Interested in this role?</h3>
                {!vacancy.is_public && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                    <Lock className="h-3 w-3 flex-shrink-0" />
                    Private vacancy — you'll need a passcode from the employer.
                  </p>
                )}
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                  {!userProfile ? "Create a free account or log in to apply." : "Click Apply Now to submit your application."}
                </p>
                <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {!userProfile ? "Login to Apply" : "Apply Now"}
                </Button>
                {!userProfile && (
                  <Button variant="outline" className="w-full mt-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    onClick={() => navigate({ to: "/register" })}>
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
