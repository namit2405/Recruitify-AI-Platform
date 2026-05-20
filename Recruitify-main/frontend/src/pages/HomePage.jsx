import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { usePageTitle } from '../hooks/usePageTitle';
import { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  
  // Set page title
  usePageTitle('Home');

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.userType === 'organization') {
        navigate({ to: '/organization/dashboard' });
      } else if (userProfile.userType === 'candidate') {
        navigate({ to: '/candidate/dashboard' });
      }
    }
  }, [user, userProfile, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium shadow-sm animate-pulse-soft">
                ✨ New: AI-Powered Talent Matching
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">Connect</span>
                <br />
                <span className="text-blue-600 dark:text-blue-400 italic">Talent</span>
                <span className="text-gray-900 dark:text-white"> with</span>
                <br />
                <span className="text-blue-600 dark:text-blue-400 italic">Opportunity</span>
              </h1>
              
              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
                The modern recruitment ecosystem that helps top-tier organizations build elite teams while empowering professionals to find their next career breakthrough.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: '/register/organization' })}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-base font-medium rounded-lg shadow-lg hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
                >
                  Hire Talent 
                  <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ to: '/register/candidate' })}
                  className="border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-6 text-base font-medium rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  Browse Openings
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900"></div>
                  <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900"></div>
                  <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                  <div className="w-10 h-10 rounded-full bg-orange-500 border-2 border-white dark:border-gray-900"></div>
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">Trusted by 2,500+ Companies</p>
                  <p className="text-gray-600 dark:text-gray-400">🏆 #1 Recruitment Tool 2024</p>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative animate-scale-in stagger-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/hero-homepage.avif"
                  alt="Recruitment Platform"
                  className="w-full h-auto"
                />
                {/* Floating Card - Smaller on mobile, positioned at bottom */}
                <div className="absolute bottom-4 left-4 right-4 lg:bottom-8 lg:left-8 lg:right-8 bg-white dark:bg-gray-800 rounded-xl p-3 lg:p-6 shadow-xl">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white">Efficiency Boosted by 45%</p>
                      <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Global Enterprise reported faster hiring cycles.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Employers Section */}
      <section className="py-24 px-4 bg-white dark:bg-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4">
              For Employers
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Build Your Dream Team</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our suite of specialized tools is designed to streamline your entire recruitment pipeline, from initial sourcing to onboarding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-1">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Intelligent Sourcing</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Identify top passive and active candidates using AI algorithms that understand context, skill proximity, and cultural fit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Global Talent Network Access</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Automated Skill Assessment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Custom Pipeline Stages</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-2">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Collaborative Hiring</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Bring your entire team into the loop with integrated feedback loops, shared scorecards, and seamless calendar syncing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Real-time Interview Notes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Team Consensus Scoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Integrated Video Calling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-3">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Talent Analytics</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Make data-driven decisions with deep insights into your recruitment ROI, diversity metrics, and time-to-hire trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Diversity & Inclusion Tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Predictive Hiring Models</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Executive Summary Reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/register/organization' })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-base font-medium rounded-lg shadow-lg hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
            >
              Start Hiring Today 
              <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* For Professionals Section */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-4">
              For Professionals
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Accelerate Your Career</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Find more than just a job. Discover opportunities that align with your long-term goals and showcase your unique expertise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-1">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Smart Job Search</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Our recommendation engine learns your preferences to deliver high-quality matches that actually fit your career trajectory.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Personalized Daily Matches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Salary Transparency Data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Hidden Job Market Access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-2">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Pro Profile Builder</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Stand out with a rich digital portfolio that highlights your projects, certifications, and verifiable achievements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Skill Verification Badges</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Portfolio Import Tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">AI Resume Optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover-lift bg-white dark:bg-gray-900 animate-fade-in stagger-3">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center mb-4 shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Application Tracking</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Never lose track of an application again. Get real-time status updates and direct feedback from hiring managers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Status Change Notifications</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Interview Scheduling</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Direct Messaging Center</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/register/candidate' })}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-base font-medium rounded-lg shadow-lg hover:shadow-2xl transition-all hover:-translate-y-0.5 group"
            >
              Find Your Next Role 
              <span className="ml-2 inline-block group-hover:scale-110 transition-transform">💼</span>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
