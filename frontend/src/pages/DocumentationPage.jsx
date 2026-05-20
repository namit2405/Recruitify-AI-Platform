import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase, UserCircle, FileText, Search, MessageSquare, BarChart3,
  Upload, CheckCircle, ArrowRight, Users, Building2, Bell,
  Settings, Eye, Sparkles, Send, Star, TrendingUp, Shield, Zap,
  BookOpen, Lock, Globe, Github, Linkedin, Instagram,
  Heart, Repeat2, Image, Phone, Video, Download, Filter, GitCompare,
  Trophy, HelpCircle, Newspaper, Target, Award,
  UserPlus, Layers, Clock, MapPin, DollarSign, Hash, ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ─── Reusable sub-components ─── */

function SectionBadge({ label, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
}

function InfoBox({ icon: Icon, title, children, color = 'blue' }) {
  const colors = {
    blue: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-gray-800',
    purple: 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-gray-800',
    amber: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-gray-800',
    green: 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-gray-800',
  };
  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    amber: 'text-amber-600 dark:text-amber-400',
    green: 'text-green-600 dark:text-green-400',
  };
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${colors[color]}`}>
      {Icon && <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColors[color]}`} />}
      <div>
        {title && <p className="mb-1 font-semibold text-gray-900 dark:text-white text-sm">{title}</p>}
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

function StepFlow({ steps }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
            {i + 1}
          </span>
          <div className="pt-0.5">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{step.title}</p>
            {step.desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.desc}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function FeatureCard({ icon: Icon, iconBg, title, description, bullets, badges }) {
  return (
    <Card className="h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {badges && (
            <div className="flex flex-wrap gap-1">
              {badges.map((b, i) => (
                <SectionBadge key={i} label={b.label} color={b.color} />
              ))}
            </div>
          )}
        </div>
        <CardTitle className="text-base mt-3 text-gray-900 dark:text-white">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatusBadgeRow({ statuses }) {
  const colors = {
    Applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Shortlisted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Interviewing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Interview Scheduled': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Interview Completed': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    Hired: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Declined: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Withdrawn: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    Closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    Offers: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {statuses.map((s) => (
        <span key={s} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[s] || 'bg-gray-100 text-gray-700'}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

/* ─── Sidebar nav ─── */
function SidebarNav({ items, active, onSelect }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
            active === item.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ─── CANDIDATE TAB CONTENT ─── */

const candidateNavItems = [
  { id: 'c-getting-started', label: 'Getting Started', icon: UserPlus },
  { id: 'c-dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'c-browse-jobs', label: 'Browse & Apply', icon: Search },
  { id: 'c-applications', label: 'Application Tracking', icon: FileText },
  { id: 'c-offers', label: 'Job Offers', icon: Award },
  { id: 'c-profile', label: 'My Profile', icon: UserCircle },
  { id: 'c-analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'c-communities', label: 'My Communities', icon: Users },
  { id: 'c-feed', label: 'Feed', icon: Newspaper },
  { id: 'c-chat', label: 'Chat & Messaging', icon: MessageSquare },
  { id: 'c-public-profile', label: 'Public Profile', icon: Globe },
];

function CandidateContent({ section }) {
  switch (section) {
    case 'c-getting-started':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Getting Started as a Candidate</h2>
            <p className="text-gray-500 dark:text-gray-400">Create your account and set up your profile in minutes.</p>
          </div>
          <InfoBox icon={Sparkles} title="Quick Setup" color="blue">
            The entire onboarding process takes under 5 minutes. Have your resume ready for the best experience.
          </InfoBox>
          <StepFlow steps={[
            { title: 'Create Your Account', desc: 'Visit the Register page and choose "Candidate". Enter your full name, email address, and a secure password.' },
            { title: 'Verify Your Email', desc: 'A 6-digit OTP is sent to your email. Enter it on the verification screen. OTPs expire after 10 minutes — request a new one if needed.' },
            { title: 'Complete Your Profile', desc: 'Add your skills, work experience, education, and upload your resume. A complete profile unlocks AI-powered job recommendations.' },
            { title: 'Set Job Preferences', desc: 'Specify your preferred job types, locations, salary range, and industries so the AI can surface the most relevant opportunities.' },
            { title: 'Start Exploring', desc: 'Browse jobs, check your AI match scores, and apply with a single click.' },
          ]} />
          <SectionDivider title="Account Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBox icon={Shield} title="Email Verification" color="green">
              Your account is protected by OTP-based email verification. This ensures only you can access your account.
            </InfoBox>
            <InfoBox icon={Settings} title="Profile Completeness" color="purple">
              The dashboard shows a profile strength indicator. Aim for 100% to maximize your visibility to recruiters.
            </InfoBox>
          </div>
        </div>
      );

    case 'c-dashboard':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Candidate Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400">Your command center for job search activity and insights.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Applications', icon: FileText, color: 'bg-blue-500', desc: 'All jobs you have applied to' },
              { label: 'Pending', icon: Clock, color: 'bg-amber-500', desc: 'Awaiting recruiter review' },
              { label: 'Shortlisted', icon: Star, color: 'bg-purple-500', desc: 'Recruiters are interested' },
              { label: 'Accepted / Hired', icon: Trophy, color: 'bg-green-500', desc: 'Successful applications' },
            ].map((stat) => (
              <Card key={stat.label} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-3`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.desc}</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <SectionDivider title="Dashboard Widgets" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Sparkles}
              iconBg="bg-purple-600"
              title="AI Job Recommendations"
              description="Personalized job suggestions powered by your profile and preferences."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Recommendations update as you update your profile',
                'Each suggestion shows a match score percentage',
                'Click any recommendation to view full job details',
                'Based on your skills, experience, and job preferences',
              ]}
            />
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-blue-600"
              title="Visual Analytics Widgets"
              description="Charts and graphs to visualize your job search progress at a glance."
              bullets={[
                'Pie chart showing application status breakdown',
                'Line chart tracking applications over the last 6 months',
                'Profile strength progress bar with completion tips',
                'Quick links to recent applications',
              ]}
            />
          </div>
          <InfoBox icon={Target} title="Profile Strength Tip" color="amber">
            Profiles with a resume, profile picture, at least 5 skills, and 1 work experience entry receive significantly more recruiter views.
          </InfoBox>
        </div>
      );

    case 'c-browse-jobs':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Browse & Apply for Jobs</h2>
            <p className="text-gray-500 dark:text-gray-400">Find the right opportunities and apply with confidence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Search}
              iconBg="bg-blue-600"
              title="Smart Job Search"
              description="Powerful search and filtering to find exactly what you're looking for."
              bullets={[
                'Search by job title, company name, or keywords',
                'Filter by location, experience level, and salary range',
                'Filter by job type (full-time, part-time, remote)',
                'Sort results by date posted, match score, or relevance',
                'Autocomplete suggestions as you type',
              ]}
            />
            <FeatureCard
              icon={Sparkles}
              iconBg="bg-purple-600"
              title="AI Match Scores"
              description="See how well you match each job before you apply."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Match score from 0–100 displayed on every job card',
                'Score based on your skills, experience, and resume',
                'Color-coded: green (high), yellow (medium), red (low)',
                'Helps you prioritize which jobs to apply to first',
              ]}
            />
          </div>
          <SectionDivider title="Applying for Jobs" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Send}
              iconBg="bg-green-600"
              title="One-Click Application"
              description="Apply to jobs quickly using your saved profile and resume."
              bullets={[
                'Apply using your uploaded resume with one click',
                'Application confirmation shown immediately',
                'Applied jobs are marked so you don\'t apply twice',
                'View full job description before applying',
                'See required skills and experience level upfront',
              ]}
            />
            <FeatureCard
              icon={Lock}
              iconBg="bg-amber-600"
              title="Private Job Postings"
              description="Some organizations post exclusive jobs accessible only via passcode."
              badges={[{ label: 'Exclusive', color: 'amber' }]}
              bullets={[
                'Private jobs are marked with a lock icon',
                'Enter the passcode shared by the organization to unlock',
                'Passcodes are typically shared via email or talent pool',
                'Once unlocked, apply just like any public job',
              ]}
            />
          </div>
          <InfoBox icon={CheckCircle} title="Application Status" color="green">
            After applying, the job card updates to show "Applied" status. You can track all your applications from the Application Tracking page.
          </InfoBox>
        </div>
      );

    case 'c-applications':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Application Tracking</h2>
            <p className="text-gray-500 dark:text-gray-400">Monitor every application and stay on top of your job search.</p>
          </div>
          <InfoBox icon={Eye} title="Full Visibility" color="blue">
            Every application you submit is tracked in real time. You'll always know exactly where you stand in the hiring process.
          </InfoBox>
          <FeatureCard
            icon={Layers}
            iconBg="bg-blue-600"
            title="Application Status Tabs"
            description="Filter your applications by their current stage in the hiring pipeline."
            bullets={[
              'All — see every application in one place',
              'Applied — submitted and awaiting review',
              'Interviewing — recruiter has moved you to interview stage',
              'Offers — you have received a job offer',
              'Closed — vacancy was closed or application was rejected',
            ]}
          />
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Status Labels:</p>
            <StatusBadgeRow statuses={['Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Hired', 'Rejected', 'Closed']} />
          </div>
          <SectionDivider title="Insights & Feedback" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-indigo-600"
              title="Response Rate Tracking"
              description="Understand how recruiters are responding to your applications."
              bullets={[
                'See your overall response rate percentage',
                'Track which types of jobs get the most responses',
                'Identify patterns in successful applications',
              ]}
            />
            <FeatureCard
              icon={MessageSquare}
              iconBg="bg-teal-600"
              title="Recruiter Feedback"
              description="Organizations can leave feedback on your application."
              bullets={[
                'View feedback notes left by recruiters',
                'Understand why an application was rejected',
                'Use feedback to improve future applications',
              ]}
            />
          </div>
        </div>
      );

    case 'c-offers':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Job Offers</h2>
            <p className="text-gray-500 dark:text-gray-400">Review, accept, or decline job offers from organizations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Award}
              iconBg="bg-green-600"
              title="Offer Management"
              description="All your job offers in one organized place."
              bullets={[
                'View all received offers with full details',
                'See the offer message from the recruiter',
                'Accept or decline with a single click',
                'Declined offers are moved to history',
                'Accepted offers update your application status to Hired',
              ]}
            />
            <FeatureCard
              icon={Filter}
              iconBg="bg-blue-600"
              title="Filter Offers by Status"
              description="Quickly find offers based on their current state."
              bullets={[
                'Pending — offers awaiting your response',
                'Accepted — offers you have accepted',
                'Declined — offers you have turned down',
                'Withdrawn — offers the organization has retracted',
              ]}
            />
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Status Labels:</p>
            <StatusBadgeRow statuses={['Pending', 'Accepted', 'Declined', 'Withdrawn']} />
          </div>
          <InfoBox icon={Bell} title="Offer Notifications" color="amber">
            You'll receive a real-time notification as soon as an organization sends you a job offer. Don't miss your opportunity!
          </InfoBox>
        </div>
      );

    case 'c-profile':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Profile</h2>
            <p className="text-gray-500 dark:text-gray-400">Build a compelling profile that stands out to recruiters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={UserCircle}
              iconBg="bg-blue-600"
              title="Personal Information"
              description="Your core identity on the platform."
              bullets={[
                'Full name, headline, and professional summary',
                'Upload a profile picture (shown on all your posts and applications)',
                'Upload a cover photo for your public profile banner',
                'Location, phone number, and contact details',
                'Edit any field at any time',
              ]}
            />
            <FeatureCard
              icon={Briefcase}
              iconBg="bg-indigo-600"
              title="Work Experience"
              description="Showcase your professional history."
              bullets={[
                'Add multiple work experience entries',
                'Include company name, role, dates, and description',
                'Toggle visibility of individual entries',
                'Experience is used by AI for match scoring',
                'Displayed chronologically on your public profile',
              ]}
            />
            <FeatureCard
              icon={BookOpen}
              iconBg="bg-purple-600"
              title="Education"
              description="List your academic background and qualifications."
              bullets={[
                'Add degrees, institutions, and graduation years',
                'Include field of study and relevant coursework',
                'Multiple education entries supported',
                'Shown prominently on your public profile',
              ]}
            />
            <FeatureCard
              icon={Star}
              iconBg="bg-amber-600"
              title="Skills & Accomplishments"
              description="Highlight what you're good at and what you've achieved."
              bullets={[
                'Add skills as tags (used for AI matching)',
                'Accomplishments section for certifications, awards, projects',
                'Skills are matched against job requirements',
                'More skills = better AI match scores',
              ]}
            />
            <FeatureCard
              icon={Target}
              iconBg="bg-rose-600"
              title="Job Preferences"
              description="Tell the platform what you're looking for."
              bullets={[
                'Preferred job types (full-time, part-time, contract, remote)',
                'Preferred locations and willingness to relocate',
                'Expected salary range',
                'Preferred industries and roles',
                'Used to power AI job recommendations',
              ]}
            />
            <FeatureCard
              icon={Globe}
              iconBg="bg-teal-600"
              title="Social Links & Resume"
              description="Connect your online presence and upload your resume."
              bullets={[
                'Link your Website, GitHub, LinkedIn, and Instagram',
                'Upload your resume (PDF format)',
                'View and download your uploaded resume anytime',
                'Resume is sent to organizations when you apply',
                'Replace your resume at any time',
              ]}
            />
          </div>
          <InfoBox icon={Github} title="Social Links" color="purple">
            Adding your GitHub and LinkedIn profiles significantly increases recruiter trust and engagement with your profile.
          </InfoBox>
        </div>
      );

    case 'c-analytics':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400">Data-driven insights into your job search performance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Response Rate', desc: 'Applications that received any recruiter action', icon: TrendingUp, color: 'bg-blue-500' },
              { label: 'Success Rate', desc: 'Applications that reached shortlisted or beyond', icon: Star, color: 'bg-purple-500' },
              { label: 'Hire Rate', desc: 'Applications that resulted in a job offer', icon: Trophy, color: 'bg-green-500' },
            ].map((m) => (
              <Card key={m.label} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.color} mb-3`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{m.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <SectionDivider title="Charts & History" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-blue-600"
              title="Application Status Pie Chart"
              description="Visual breakdown of all your applications by current status."
              bullets={[
                'Color-coded segments for each status',
                'Hover to see exact counts and percentages',
                'Updates in real time as statuses change',
              ]}
            />
            <FeatureCard
              icon={TrendingUp}
              iconBg="bg-indigo-600"
              title="6-Month Application History"
              description="Line chart showing your application activity over time."
              bullets={[
                'Track how many jobs you applied to each month',
                'Identify your most active job search periods',
                'Compare month-over-month trends',
                'Spot seasonal patterns in your job search',
              ]}
            />
          </div>
        </div>
      );

    case 'c-communities':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Communities</h2>
            <p className="text-gray-500 dark:text-gray-400">Join organization talent pools and stay connected to opportunities.</p>
          </div>
          <FeatureCard
            icon={Users}
            iconBg="bg-blue-600"
            title="Talent Pool Membership"
            description="Organizations maintain talent pools of interested candidates."
            bullets={[
              'Join an organization\'s talent pool to express ongoing interest',
              'View all your current community memberships',
              'See member count and join date for each community',
              'Leave a community at any time',
              'Get notified when the organization posts new jobs',
              'Organizations can browse talent pool members when hiring',
            ]}
          />
          <InfoBox icon={Bell} title="Job Notifications" color="blue">
            When you join a talent pool, you'll automatically receive notifications whenever that organization posts a new vacancy. Stay ahead of the competition.
          </InfoBox>
          <InfoBox icon={Building2} title="How to Join" color="green">
            Visit any organization's public profile and click "Join Talent Pool". You can also join from the organization's vacancy listings.
          </InfoBox>
        </div>
      );

    case 'c-feed':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Feed</h2>
            <p className="text-gray-500 dark:text-gray-400">Share updates, engage with the community, and build your professional presence.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Newspaper}
              iconBg="bg-blue-600"
              title="Create Posts"
              description="Share different types of content with the Recruitify community."
              bullets={[
                'Update — share general professional updates',
                'Hiring — post about open roles at your organization',
                'Achievement — celebrate milestones and accomplishments',
                'Article — write long-form professional content',
                'Question — ask the community for advice or opinions',
                'Attach images to any post type',
              ]}
            />
            <FeatureCard
              icon={Heart}
              iconBg="bg-rose-600"
              title="Engage with Content"
              description="Interact with posts from candidates and organizations."
              bullets={[
                'Like posts to show appreciation',
                'Comment to start conversations',
                'Repost to share content with your followers',
                'View who liked and commented on posts',
                'Reply to specific comments in threads',
              ]}
            />
          </div>
          <InfoBox icon={Image} title="Image Uploads" color="purple">
            You can attach images to your posts to make them more engaging. Supported formats include JPG, PNG, and WebP.
          </InfoBox>
        </div>
      );

    case 'c-chat':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Chat & Messaging</h2>
            <p className="text-gray-500 dark:text-gray-400">Communicate directly with recruiters and other professionals in real time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={MessageSquare}
              iconBg="bg-blue-600"
              title="Real-Time Messaging"
              description="Instant messaging powered by WebSocket technology."
              bullets={[
                'Messages delivered instantly without page refresh',
                'See when the other person is online',
                'Message read receipts',
                'Full conversation history preserved',
                'Search through past conversations',
              ]}
            />
            <FeatureCard
              icon={Upload}
              iconBg="bg-indigo-600"
              title="File Attachments"
              description="Share files directly in conversations."
              bullets={[
                'Attach documents, PDFs, and images',
                'Files are securely stored and accessible',
                'Download attachments at any time',
                'Preview images inline in the chat',
              ]}
            />
            <FeatureCard
              icon={ArrowRight}
              iconBg="bg-teal-600"
              title="Reply to Messages"
              description="Keep conversations organized with threaded replies."
              bullets={[
                'Reply to any specific message in a conversation',
                'Quoted message shown above your reply',
                'Helps maintain context in long conversations',
              ]}
            />
            <FeatureCard
              icon={Phone}
              iconBg="bg-green-600"
              title="Voice & Video Calls"
              description="Go beyond text with real-time audio and video."
              bullets={[
                'Start a voice call directly from any conversation',
                'Video calls for face-to-face interviews',
                'Powered by Agora RTC for high-quality streams',
                'Works in the browser — no app download needed',
              ]}
            />
          </div>
          <InfoBox icon={Shield} title="Message Requests" color="amber">
            To protect your privacy, messages from people you don't follow go to a Message Requests folder. You can accept or decline them.
          </InfoBox>
        </div>
      );

    case 'c-public-profile':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Public Profile</h2>
            <p className="text-gray-500 dark:text-gray-400">Your professional presence visible to organizations and other users.</p>
          </div>
          <FeatureCard
            icon={Globe}
            iconBg="bg-blue-600"
            title="Public Profile Page"
            description="A dedicated page showcasing your professional identity."
            bullets={[
              'Profile picture, cover photo, name, and headline',
              'Professional summary and contact information',
              'Skills listed as searchable tags',
              'Work experience timeline',
              'Education history',
              'Accomplishments and certifications',
              'Social links (Website, GitHub, LinkedIn, Instagram)',
              'Follow and Message buttons for visitors',
              'Follower and following counts',
            ]}
          />
          <SectionDivider title="Visibility & Privacy" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBox icon={Eye} title="Who Can See Your Profile" color="blue">
              Your public profile is visible to all logged-in users, including recruiters and organizations. Make sure it represents you well.
            </InfoBox>
            <InfoBox icon={Users} title="Follow System" color="purple">
              Other users can follow you to see your feed posts. You can follow organizations to stay updated on their job postings and news.
            </InfoBox>
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* ─── ORGANIZATION TAB CONTENT ─── */

const orgNavItems = [
  { id: 'o-getting-started', label: 'Getting Started', icon: UserPlus },
  { id: 'o-dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'o-post-vacancy', label: 'Post a Vacancy', icon: Briefcase },
  { id: 'o-manage-vacancies', label: 'Manage Vacancies', icon: Settings },
  { id: 'o-review-candidates', label: 'Review Candidates', icon: Users },
  { id: 'o-ai-analysis', label: 'AI Application Analysis', icon: Sparkles },
  { id: 'o-comparison', label: 'Candidate Comparison', icon: GitCompare },
  { id: 'o-pipeline', label: 'Hiring Pipeline', icon: Layers },
  { id: 'o-resumes', label: 'Browse Resumes', icon: FileText },
  { id: 'o-talent-pool', label: 'Talent Pool', icon: Users },
  { id: 'o-offers', label: 'Sent Offers', icon: Send },
  { id: 'o-profile', label: 'Organization Profile', icon: Building2 },
  { id: 'o-analytics', label: 'Analytics', icon: TrendingUp },
];

function OrgContent({ section }) {
  switch (section) {
    case 'o-getting-started':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Getting Started as an Organization</h2>
            <p className="text-gray-500 dark:text-gray-400">Set up your company account and start hiring in minutes.</p>
          </div>
          <InfoBox icon={Building2} title="Organization Account" color="blue">
            Organization accounts have access to advanced hiring tools including AI analysis, candidate comparison, and the hiring pipeline.
          </InfoBox>
          <StepFlow steps={[
            { title: 'Register Your Organization', desc: 'Go to Register and select "Organization". Enter your company name, email, and password.' },
            { title: 'Verify Your Email', desc: 'A 6-digit OTP is sent to your registered email. Enter it to activate your account.' },
            { title: 'Complete Your Company Profile', desc: 'Add your company description, industry, size, location, website, and upload your logo and cover photo.' },
            { title: 'Post Your First Vacancy', desc: 'Navigate to "Post a Vacancy" and fill in the job details. Your listing goes live immediately.' },
            { title: 'Review Applications', desc: 'As candidates apply, use the AI analysis tools to shortlist the best matches efficiently.' },
          ]} />
          <SectionDivider title="Account Features" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBox icon={Sparkles} title="AI-Powered Hiring" color="purple">
              Every application is automatically analyzed by AI, giving you match scores, skill gap analysis, and recruiter summaries — saving hours of manual screening.
            </InfoBox>
            <InfoBox icon={Shield} title="Data Security" color="green">
              All candidate data is handled securely. Resumes and personal information are only accessible to your organization's account.
            </InfoBox>
          </div>
        </div>
      );

    case 'o-dashboard':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Organization Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400">A real-time overview of your recruitment activity.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Open Vacancies', icon: Briefcase, color: 'bg-blue-500', desc: 'Currently active job postings' },
              { label: 'Total Applications', icon: FileText, color: 'bg-indigo-500', desc: 'Across all your vacancies' },
              { label: 'Shortlisted', icon: Star, color: 'bg-purple-500', desc: 'Candidates marked for review' },
              { label: 'Hired This Month', icon: Trophy, color: 'bg-green-500', desc: 'Successful hires' },
            ].map((stat) => (
              <Card key={stat.label} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-3`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.desc}</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <SectionDivider title="Dashboard Widgets" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={TrendingUp}
              iconBg="bg-blue-600"
              title="Application Trends"
              description="Track how applications are flowing in over time."
              bullets={[
                'Line chart showing daily/weekly application volume',
                'Identify peak application periods',
                'Compare trends across different vacancies',
              ]}
            />
            <FeatureCard
              icon={Zap}
              iconBg="bg-amber-600"
              title="Quick Actions"
              description="Common tasks accessible directly from the dashboard."
              bullets={[
                'Post a new vacancy with one click',
                'Jump to pending applications',
                'View candidates awaiting review',
                'Access the hiring pipeline',
              ]}
            />
          </div>
        </div>
      );

    case 'o-post-vacancy':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Post a Vacancy</h2>
            <p className="text-gray-500 dark:text-gray-400">Create detailed job listings that attract the right candidates.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={FileText}
              iconBg="bg-blue-600"
              title="Job Details"
              description="Provide comprehensive information about the role."
              bullets={[
                'Job title and detailed description',
                'Required skills (used for AI matching)',
                'Experience level (Entry / Mid / Senior / Lead)',
                'Employment type (Full-time, Part-time, Contract, Remote)',
                'Location (city, country, or remote)',
                'Salary range (optional but recommended)',
              ]}
            />
            <FeatureCard
              icon={Settings}
              iconBg="bg-indigo-600"
              title="Vacancy Settings"
              description="Control who can see and apply to your job."
              bullets={[
                'Set a candidate limit to cap total applications',
                'Toggle between Public and Private visibility',
                'Private jobs require a passcode to apply',
                'Set application deadline',
                'Vacancy goes live immediately upon posting',
              ]}
            />
          </div>
          <InfoBox icon={Lock} title="Private Vacancies" color="amber">
            Private vacancies are hidden from public search. Only candidates with the correct passcode can view and apply. Share the passcode via email or your talent pool.
          </InfoBox>
          <InfoBox icon={Sparkles} title="AI Matching Tip" color="purple">
            The more specific your required skills list, the more accurate the AI match scores will be. Include both technical and soft skills.
          </InfoBox>
        </div>
      );

    case 'o-manage-vacancies':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Manage Vacancies</h2>
            <p className="text-gray-500 dark:text-gray-400">Full control over all your job postings in one place.</p>
          </div>
          <FeatureCard
            icon={Briefcase}
            iconBg="bg-blue-600"
            title="Vacancy Management"
            description="View and manage all your job postings."
            bullets={[
              'See all vacancies with open/closed status',
              'View application count per vacancy',
              'Toggle vacancy status between open and closed',
              'Edit vacancy details at any time',
              'Delete vacancies you no longer need',
              'Filter vacancies by status (open/closed)',
              'Sort by date posted or application count',
            ]}
          />
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vacancy Status:</p>
            <StatusBadgeRow statuses={['Applied', 'Closed']} />
          </div>
          <InfoBox icon={Settings} title="Closing a Vacancy" color="amber">
            Closing a vacancy stops new applications but preserves all existing applications and candidate data. You can reopen it at any time.
          </InfoBox>
        </div>
      );

    case 'o-review-candidates':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Review Candidates</h2>
            <p className="text-gray-500 dark:text-gray-400">Efficiently screen and evaluate all applicants with AI assistance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Filter}
              iconBg="bg-blue-600"
              title="Filter & Sort Applications"
              description="Find the right candidates quickly."
              bullets={[
                'Filter by vacancy to see applications for a specific job',
                'Filter by application status',
                'Sort by AI match score (highest first)',
                'Sort by application date',
                'Search by candidate name or skill',
              ]}
            />
            <FeatureCard
              icon={Sparkles}
              iconBg="bg-purple-600"
              title="AI Match Scores"
              description="Instantly see how well each candidate fits the role."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Score from 0–100 for every application',
                'Color-coded for quick visual scanning',
                'Based on skills, experience, and resume content',
                'Helps prioritize who to review first',
              ]}
            />
            <FeatureCard
              icon={Users}
              iconBg="bg-green-600"
              title="Candidate Actions"
              description="Take action on applications directly from the review screen."
              bullets={[
                'Shortlist promising candidates',
                'Mark candidates as Hired',
                'Reject applications with optional feedback',
                'Download candidate resumes',
                'View full candidate public profile',
                'Move candidates through the hiring pipeline',
              ]}
            />
            <FeatureCard
              icon={Eye}
              iconBg="bg-indigo-600"
              title="Candidate Profiles"
              description="Deep-dive into any candidate's background."
              bullets={[
                'View full profile: skills, experience, education',
                'See their social links and portfolio',
                'Review their uploaded resume inline',
                'Check their profile completeness score',
              ]}
            />
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Statuses:</p>
            <StatusBadgeRow statuses={['Applied', 'Reviewing', 'Shortlisted', 'Interviewing', 'Hired', 'Rejected']} />
          </div>
        </div>
      );

    case 'o-ai-analysis':
      return (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Application Analysis</h2>
              <SectionBadge label="AI Powered" color="purple" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Deep AI-driven insights for every application — no manual screening required.</p>
          </div>
          <InfoBox icon={Sparkles} title="How It Works" color="purple">
            Our AI engine analyzes each candidate's resume against the job requirements using semantic similarity, skill matching, and experience calculation to produce a comprehensive hiring recommendation.
          </InfoBox>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Target}
              iconBg="bg-purple-600"
              title="Match Score (0–100)"
              description="A single number summarizing overall candidate fit."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Composite score from multiple AI signals',
                '80–100: Highly Preferred candidate',
                '60–79: Mid-tier candidate',
                '40–59: Low match',
                'Below 40: Not recommended',
                'Score recalculates if job requirements change',
              ]}
            />
            <FeatureCard
              icon={CheckCircle}
              iconBg="bg-green-600"
              title="Skill Analysis"
              description="Detailed breakdown of skill alignment."
              bullets={[
                'Matched skills — skills the candidate has that the job requires',
                'Skill gaps — required skills the candidate is missing',
                'Semantic fit percentage — how closely resume language matches job description',
                'Partial matches detected via semantic similarity',
              ]}
            />
            <FeatureCard
              icon={Clock}
              iconBg="bg-blue-600"
              title="Experience Calculation"
              description="Automated experience level assessment."
              bullets={[
                'Total years of relevant experience extracted from resume',
                'Compared against job\'s required experience level',
                'Seniority level inferred automatically',
                'Experience gaps highlighted clearly',
              ]}
            />
            <FeatureCard
              icon={Sparkles}
              iconBg="bg-indigo-600"
              title="AI Recruiter Summary"
              description="Human-readable AI assessment of the candidate."
              bullets={[
                'AI-generated strengths specific to this role',
                'AI-identified weaknesses or concerns',
                'Recommendation: Strong Hire / Hire / Maybe / No Hire',
                'Narrative summary a recruiter can act on immediately',
                'Export the full analysis as PDF or Excel',
              ]}
            />
          </div>
          <InfoBox icon={Download} title="Export Analysis" color="green">
            Every AI analysis report can be exported as a PDF or Excel file for sharing with your hiring team or keeping records.
          </InfoBox>
        </div>
      );

    case 'o-comparison':
      return (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Candidate Comparison</h2>
              <SectionBadge label="New" color="green" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Compare multiple candidates side by side to make the best hiring decision.</p>
          </div>
          <FeatureCard
            icon={GitCompare}
            iconBg="bg-blue-600"
            title="Side-by-Side Comparison"
            description="Select multiple candidates and compare them on a single screen."
            badges={[{ label: 'AI Powered', color: 'purple' }]}
            bullets={[
              'Select 2 or more candidates from the review screen',
              'Side-by-side layout with all key metrics',
              'AI match score comparison with visual bars',
              'Skills deep-dive: matched vs. missing for each candidate',
              'Experience years comparison',
              'Education level comparison',
              'Recommendation labels shown for each candidate',
              'Helps make data-driven final hiring decisions',
            ]}
          />
          <InfoBox icon={Target} title="Best Practice" color="blue">
            Use candidate comparison after shortlisting your top 3–5 candidates. The side-by-side view makes it easy to identify the strongest overall fit.
          </InfoBox>
        </div>
      );

    case 'o-pipeline':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Hiring Pipeline</h2>
            <p className="text-gray-500 dark:text-gray-400">Visual Kanban board to manage candidates through every stage of hiring.</p>
          </div>
          <FeatureCard
            icon={Layers}
            iconBg="bg-indigo-600"
            title="Kanban Pipeline View"
            description="Drag-and-drop candidates through your hiring stages."
            bullets={[
              'Visual columns for each hiring stage',
              'Move candidates between stages with ease',
              'See all candidates across all stages at a glance',
              'Candidate cards show name, role, and AI score',
              'Funnel progress bar shows conversion at each stage',
            ]}
          />
          <SectionDivider title="Pipeline Stages" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { stage: 'Applied', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
              { stage: 'Reviewing', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
              { stage: 'Shortlisted', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
              { stage: 'Interview Scheduled', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
              { stage: 'Interview Completed', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
              { stage: 'Hired', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
            ].map(({ stage, color }) => (
              <div key={stage} className={`rounded-lg p-3 text-center text-xs font-semibold ${color}`}>
                {stage}
              </div>
            ))}
          </div>
          <InfoBox icon={ArrowRight} title="Moving Candidates" color="blue">
            Click on a candidate card and select the new stage, or drag the card to the appropriate column. All stage changes are logged with timestamps.
          </InfoBox>
        </div>
      );

    case 'o-resumes':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Browse Resumes</h2>
            <p className="text-gray-500 dark:text-gray-400">Access and organize all candidate resumes by vacancy and AI score category.</p>
          </div>
          <FeatureCard
            icon={FileText}
            iconBg="bg-blue-600"
            title="Resume Browser"
            description="Organized access to all submitted resumes."
            bullets={[
              'Resumes organized by vacancy for easy navigation',
              'AI score categories: Highly Preferred / Mid / Low / Don\'t Visit',
              'Download individual resumes as PDF',
              'Bulk download all resumes for a vacancy',
              'Preview resume details without downloading',
              'Sorted by AI match score within each category',
            ]}
          />
          <SectionDivider title="AI Score Categories" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Highly Preferred', desc: 'Score 80–100', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
              { label: 'Mid', desc: 'Score 60–79', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
              { label: 'Low', desc: 'Score 40–59', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
              { label: "Don't Visit", desc: 'Score below 40', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
            ].map(({ label, desc, color }) => (
              <div key={label} className={`rounded-lg border p-3 text-center ${color}`}>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs mt-1 opacity-75">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'o-talent-pool':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Talent Pool</h2>
            <p className="text-gray-500 dark:text-gray-400">Your community of interested candidates ready to be hired.</p>
          </div>
          <FeatureCard
            icon={Users}
            iconBg="bg-blue-600"
            title="Talent Pool Management"
            description="Browse and search candidates who have joined your community."
            bullets={[
              'View all candidates who joined your talent pool',
              'Search members by name or skill',
              'Filter by specific skills to find relevant candidates',
              'See member join dates and profile stats',
              'View full candidate profiles directly',
              'Invite talent pool members to apply for specific vacancies',
              'Members are notified when you post new jobs',
            ]}
          />
          <InfoBox icon={Bell} title="Automatic Notifications" color="blue">
            Every time you post a new vacancy, all members of your talent pool receive an automatic notification. This ensures your best candidates hear about opportunities first.
          </InfoBox>
        </div>
      );

    case 'o-offers':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Sent Offers</h2>
            <p className="text-gray-500 dark:text-gray-400">Track and manage all job offers you've extended to candidates.</p>
          </div>
          <FeatureCard
            icon={Send}
            iconBg="bg-green-600"
            title="Offer Tracking"
            description="Full visibility into the status of every offer you've sent."
            bullets={[
              'View all sent offers with current status',
              'See the offer message you sent to each candidate',
              'Track when offers were sent and responded to',
              'Withdraw pending offers if circumstances change',
              'View the candidate\'s profile from the offer record',
              'Filter offers by status: Pending / Accepted / Declined / Withdrawn',
            ]}
          />
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offer Status Labels:</p>
            <StatusBadgeRow statuses={['Pending', 'Accepted', 'Declined', 'Withdrawn']} />
          </div>
          <InfoBox icon={Bell} title="Offer Notifications" color="amber">
            You'll receive a notification when a candidate accepts or declines your offer, so you can act quickly.
          </InfoBox>
        </div>
      );

    case 'o-profile':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Organization Profile</h2>
            <p className="text-gray-500 dark:text-gray-400">Build a compelling company presence to attract top talent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Building2}
              iconBg="bg-blue-600"
              title="Company Information"
              description="Tell candidates who you are and what you stand for."
              bullets={[
                'Company name, tagline, and description',
                'Industry, company size, and founding year',
                'Headquarters location',
                'Company website URL',
                'Contact email and phone number',
              ]}
            />
            <FeatureCard
              icon={Image}
              iconBg="bg-indigo-600"
              title="Visual Branding"
              description="Make your profile stand out with professional visuals."
              bullets={[
                'Upload your company logo',
                'Upload a cover photo for your profile banner',
                'Images are displayed on your public profile',
                'Logo appears on all your job listings',
                'Supported formats: JPG, PNG, WebP',
              ]}
            />
          </div>
          <InfoBox icon={Globe} title="Public Visibility" color="blue">
            Your organization profile is publicly visible. Candidates can find you through search, follow your page, and join your talent pool directly from your profile.
          </InfoBox>
        </div>
      );

    case 'o-analytics':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Organization Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400">Measure and optimize your recruitment performance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Conversion Rate', desc: 'Applications that progressed past initial review', icon: TrendingUp, color: 'bg-blue-500' },
              { label: 'Success Rate', desc: 'Vacancies that resulted in a hire', icon: Trophy, color: 'bg-green-500' },
              { label: 'Avg. Time to Hire', desc: 'Days from posting to offer accepted', icon: Clock, color: 'bg-purple-500' },
            ].map((m) => (
              <Card key={m.label} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${m.color} mb-3`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{m.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <SectionDivider title="Charts & Reports" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={BarChart3}
              iconBg="bg-blue-600"
              title="Vacancy Performance Bar Chart"
              description="Compare application volume and hire rates across all your vacancies."
              bullets={[
                'Bar chart with one bar per vacancy',
                'Shows total applications, shortlisted, and hired counts',
                'Identify which job titles attract the most candidates',
                'Spot vacancies that need better descriptions',
              ]}
            />
            <FeatureCard
              icon={Download}
              iconBg="bg-green-600"
              title="Export Reports"
              description="Share analytics data with your team or leadership."
              bullets={[
                'Export full analytics report as PDF',
                'Export raw data as Excel spreadsheet',
                'Includes all metrics and chart data',
                'Professional formatting ready for presentations',
              ]}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* ─── PLATFORM FEATURES TAB CONTENT ─── */

const platformNavItems = [
  { id: 'p-ai-matching', label: 'AI-Powered Matching', icon: Sparkles },
  { id: 'p-notifications', label: 'Notifications', icon: Bell },
  { id: 'p-search', label: 'Global Search', icon: Search },
  { id: 'p-theme', label: 'Dark / Light Mode', icon: Eye },
  { id: 'p-mobile', label: 'Mobile Responsive', icon: Globe },
  { id: 'p-private-jobs', label: 'Private Job Postings', icon: Lock },
  { id: 'p-social', label: 'Social Features', icon: Users },
  { id: 'p-export', label: 'Export Reports', icon: Download },
];

function PlatformContent({ section }) {
  switch (section) {
    case 'p-ai-matching':
      return (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Matching</h2>
              <SectionBadge label="AI Powered" color="purple" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">The intelligence engine behind Recruitify's hiring recommendations.</p>
          </div>
          <InfoBox icon={Sparkles} title="How Our AI Works" color="purple">
            Recruitify uses a multi-signal AI model that combines semantic text similarity, structured skill matching, and experience analysis to produce accurate, explainable match scores.
          </InfoBox>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={FileText}
              iconBg="bg-purple-600"
              title="Resume Scoring"
              description="Every resume is analyzed against job requirements automatically."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Resume text is parsed and structured by AI',
                'Skills extracted and matched against job requirements',
                'Experience years calculated from work history',
                'Education level assessed and compared',
                'Score generated within seconds of application',
              ]}
            />
            <FeatureCard
              icon={Target}
              iconBg="bg-indigo-600"
              title="Semantic Similarity"
              description="Goes beyond keyword matching to understand meaning."
              badges={[{ label: 'AI Powered', color: 'purple' }]}
              bullets={[
                'Understands synonyms and related terms',
                '"React" and "ReactJS" treated as equivalent',
                'Job description language matched to resume language',
                'Semantic fit percentage shown in analysis',
                'More accurate than simple keyword matching',
              ]}
            />
            <FeatureCard
              icon={CheckCircle}
              iconBg="bg-green-600"
              title="Skill Gap Analysis"
              description="Identify exactly what skills a candidate is missing."
              bullets={[
                'Lists every required skill from the job posting',
                'Marks each skill as matched or missing',
                'Partial matches detected via semantic analysis',
                'Helps candidates know what to learn',
                'Helps recruiters understand candidate readiness',
              ]}
            />
            <FeatureCard
              icon={Sparkles}
              iconBg="bg-rose-600"
              title="Smart Recommendations"
              description="AI surfaces the best opportunities and candidates proactively."
              bullets={[
                'Candidates see personalized job recommendations on dashboard',
                'Recommendations ranked by predicted match score',
                'Updates automatically as profile is improved',
                'Organizations see top-scored candidates highlighted',
              ]}
            />
          </div>
        </div>
      );

    case 'p-notifications':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Real-Time Notifications</h2>
            <p className="text-gray-500 dark:text-gray-400">Stay informed about everything that matters, the moment it happens.</p>
          </div>
          <FeatureCard
            icon={Bell}
            iconBg="bg-blue-600"
            title="Notification Center"
            description="A centralized hub for all your platform activity."
            bullets={[
              'Unread notification badge on the bell icon in the header',
              'Notification center accessible from any page',
              'Notifications for: new applications, status changes, job offers',
              'Notifications for: new messages, talent pool activity',
              'Notifications for: new jobs from followed organizations',
              'Mark individual notifications as read',
              'Mark all notifications as read at once',
              'Real-time delivery — no page refresh needed',
            ]}
          />
          <InfoBox icon={Zap} title="Real-Time Delivery" color="blue">
            Notifications are delivered instantly via WebSocket connections. You'll see the badge update in real time without needing to refresh the page.
          </InfoBox>
        </div>
      );

    case 'p-search':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Global Search</h2>
            <p className="text-gray-500 dark:text-gray-400">Find anything on the platform instantly with intelligent search.</p>
          </div>
          <FeatureCard
            icon={Search}
            iconBg="bg-blue-600"
            title="Universal Search"
            description="One search bar to find everything across the platform."
            bullets={[
              'Search for jobs by title, description, or required skills',
              'Search for candidates by name or skill',
              'Search for organizations by name or industry',
              'Autocomplete suggestions appear as you type',
              'Results grouped by category (Jobs / Candidates / Organizations)',
              'Click any result to navigate directly to that page',
              'Search history for quick re-access',
            ]}
          />
          <InfoBox icon={Zap} title="Autocomplete" color="blue">
            The search bar shows live suggestions as you type, making it fast to find what you're looking for without typing the full query.
          </InfoBox>
        </div>
      );

    case 'p-theme':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dark / Light Mode</h2>
            <p className="text-gray-500 dark:text-gray-400">Choose the visual theme that works best for you.</p>
          </div>
          <FeatureCard
            icon={Eye}
            iconBg="bg-indigo-600"
            title="Full Theme Support"
            description="Every page and component supports both light and dark modes."
            bullets={[
              'Toggle between light and dark mode from the header',
              'Your preference is saved and persists across sessions',
              'All pages, charts, and modals fully themed',
              'Smooth transition animation between modes',
              'Follows system preference by default on first visit',
            ]}
          />
          <InfoBox icon={Settings} title="Theme Persistence" color="blue">
            Your theme preference is stored locally and remembered every time you return to Recruitify.
          </InfoBox>
        </div>
      );

    case 'p-mobile':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mobile Responsive</h2>
            <p className="text-gray-500 dark:text-gray-400">A seamless experience on any device, any screen size.</p>
          </div>
          <FeatureCard
            icon={Globe}
            iconBg="bg-green-600"
            title="Fully Responsive Design"
            description="Recruitify works beautifully on phones, tablets, and desktops."
            bullets={[
              'Responsive layouts that adapt to any screen size',
              'Mobile-optimized navigation with collapsible menus',
              'Touch-friendly buttons and interactive elements',
              'Charts and tables scroll horizontally on small screens',
              'Full feature parity between mobile and desktop',
              'No app download required — works in any browser',
            ]}
          />
          <InfoBox icon={Zap} title="Progressive Web App" color="blue">
            Recruitify is optimized for performance on mobile networks. Pages load fast even on slower connections.
          </InfoBox>
        </div>
      );

    case 'p-private-jobs':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Private Job Postings</h2>
            <p className="text-gray-500 dark:text-gray-400">Exclusive, passcode-protected vacancies for targeted hiring.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={Lock}
              iconBg="bg-amber-600"
              title="For Organizations"
              description="Create exclusive job postings for specific candidate pools."
              bullets={[
                'Toggle any vacancy to "Private" when posting',
                'System generates a unique passcode automatically',
                'Share the passcode with your talent pool or via email',
                'Private jobs don\'t appear in public job search',
                'Only candidates with the passcode can apply',
                'Ideal for internal referrals and exclusive hiring',
              ]}
            />
            <FeatureCard
              icon={Key}
              iconBg="bg-blue-600"
              title="For Candidates"
              description="Access exclusive opportunities shared directly with you."
              bullets={[
                'Private jobs show a lock icon in listings',
                'Enter the passcode to unlock the full job details',
                'Apply just like any public job once unlocked',
                'Passcodes are typically shared via email or community',
              ]}
            />
          </div>
          <InfoBox icon={Shield} title="Security" color="amber">
            Passcodes are hashed and stored securely. Each private vacancy has a unique passcode that cannot be guessed.
          </InfoBox>
        </div>
      );

    case 'p-social':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Social Features</h2>
            <p className="text-gray-500 dark:text-gray-400">Build your professional network and stay connected.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={UserPlus}
              iconBg="bg-blue-600"
              title="Follow System"
              description="Follow users and organizations to stay updated."
              bullets={[
                'Follow any candidate or organization',
                'See follower and following counts on profiles',
                'Following an organization notifies you of new jobs',
                'Following a candidate shows their feed posts',
                'Unfollow at any time',
              ]}
            />
            <FeatureCard
              icon={Globe}
              iconBg="bg-indigo-600"
              title="Public Profiles"
              description="Every user and organization has a public-facing profile."
              bullets={[
                'Candidates: skills, experience, education, resume',
                'Organizations: company info, open vacancies, talent pool',
                'Follow and Message buttons on every profile',
                'Profiles are indexed and searchable',
                'Share profile links externally',
              ]}
            />
          </div>
          <InfoBox icon={Heart} title="Community Building" color="blue">
            The social layer of Recruitify helps candidates build their professional brand and helps organizations attract passive candidates who aren't actively job hunting.
          </InfoBox>
        </div>
      );

    case 'p-export':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Export Reports</h2>
            <p className="text-gray-500 dark:text-gray-400">Download your data in professional formats for sharing and record-keeping.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              icon={FileText}
              iconBg="bg-red-600"
              title="PDF Export"
              description="Generate professional PDF reports."
              bullets={[
                'AI application analysis reports as PDF',
                'Organization analytics reports as PDF',
                'Professional formatting with charts and tables',
                'Includes your organization branding',
                'Ready to share with leadership or hiring teams',
              ]}
            />
            <FeatureCard
              icon={Download}
              iconBg="bg-green-600"
              title="Excel Export"
              description="Export raw data for further analysis."
              bullets={[
                'Analytics data exported as .xlsx spreadsheet',
                'All metrics included in structured columns',
                'Filter and pivot data in Excel or Google Sheets',
                'Useful for custom reporting and dashboards',
                'Candidate lists with scores exportable',
              ]}
            />
          </div>
          <InfoBox icon={Shield} title="Data Privacy" color="blue">
            Exported files contain only data from your own account. Candidate personal information is included only in reports you generate from your own vacancy applications.
          </InfoBox>
        </div>
      );

    default:
      return null;
  }
}

// Temporary Key icon since it's not in the import list — use Lock as fallback
function Key(props) {
  return <Lock {...props} />;
}

/* ─── MAIN PAGE COMPONENT ─── */

export default function DocumentationPage() {
  usePageTitle('Documentation');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  const isAuthenticated = !!user;
  const isCandidate = userProfile?.userType === 'candidate';
  const isOrganization = userProfile?.userType === 'organization';

  const [candidateSection, setCandidateSection] = useState('c-getting-started');
  const [orgSection, setOrgSection] = useState('o-getting-started');
  const [platformSection, setPlatformSection] = useState('p-ai-matching');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />

      {/* ── Hero Section ── */}
      <section className="relative py-20 pb-16 px-4">

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-gray-800 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 mb-6 border border-blue-200 dark:border-gray-700">
            <BookOpen className="h-4 w-4" />
            Platform Documentation
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            Everything You Need to Know<br className="hidden sm:block" /> About Recruitify
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            A complete guide to every feature — whether you're a job seeker finding your next opportunity or a recruiter building your dream team.
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Users, label: '10,000+ Candidates' },
              { icon: Building2, label: '500+ Companies' },
              { icon: Sparkles, label: '95% Match Accuracy' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-6 py-3 text-gray-800 dark:text-gray-200 font-semibold text-sm">
                <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Nav Cards ── */}
      <section className="mx-auto max-w-6xl w-full px-4 mt-4 mb-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: UserCircle,
              title: 'For Candidates',
              desc: 'Find jobs, track applications, and build your career',
              color: 'from-blue-500 to-blue-600',
              tab: 'candidates',
            },
            {
              icon: Building2,
              title: 'For Organizations',
              desc: 'Post jobs, review candidates, and hire smarter',
              color: 'from-indigo-500 to-indigo-600',
              tab: 'organizations',
            },
            {
              icon: Zap,
              title: 'Platform Features',
              desc: 'AI matching, notifications, search, and more',
              color: 'from-purple-500 to-purple-600',
              tab: 'platform',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className={`rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-lg`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-white/80 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-6xl w-full px-4 py-8 flex-1">
        <Tabs defaultValue="candidates" className="w-full">
          {/* Tab triggers */}
          <TabsList className="w-full sm:w-auto mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm h-auto flex flex-wrap gap-1">
            <TabsTrigger
              value="candidates"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <UserCircle className="h-4 w-4" />
              For Candidates
            </TabsTrigger>
            <TabsTrigger
              value="organizations"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Building2 className="h-4 w-4" />
              For Organizations
            </TabsTrigger>
            <TabsTrigger
              value="platform"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Zap className="h-4 w-4" />
              Platform Features
            </TabsTrigger>
          </TabsList>

          {/* ── CANDIDATES TAB ── */}
          <TabsContent value="candidates">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar */}
              <aside className="lg:w-56 shrink-0">
                <div className="sticky top-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Sections</p>
                  <SidebarNav
                    items={candidateNavItems}
                    active={candidateSection}
                    onSelect={setCandidateSection}
                  />
                </div>
              </aside>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                  <CandidateContent section={candidateSection} />
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = candidateNavItems.findIndex(i => i.id === candidateSection);
                      if (idx > 0) setCandidateSection(candidateNavItems[idx - 1].id);
                    }}
                    disabled={candidateNavItems[0].id === candidateSection}
                    className="gap-1"
                  >
                    ← Previous
                  </Button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {candidateNavItems.findIndex(i => i.id === candidateSection) + 1} / {candidateNavItems.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = candidateNavItems.findIndex(i => i.id === candidateSection);
                      if (idx < candidateNavItems.length - 1) setCandidateSection(candidateNavItems[idx + 1].id);
                    }}
                    disabled={candidateNavItems[candidateNavItems.length - 1].id === candidateSection}
                    className="gap-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── ORGANIZATIONS TAB ── */}
          <TabsContent value="organizations">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar */}
              <aside className="lg:w-56 shrink-0">
                <div className="sticky top-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Sections</p>
                  <SidebarNav
                    items={orgNavItems}
                    active={orgSection}
                    onSelect={setOrgSection}
                  />
                </div>
              </aside>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                  <OrgContent section={orgSection} />
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = orgNavItems.findIndex(i => i.id === orgSection);
                      if (idx > 0) setOrgSection(orgNavItems[idx - 1].id);
                    }}
                    disabled={orgNavItems[0].id === orgSection}
                    className="gap-1"
                  >
                    ← Previous
                  </Button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {orgNavItems.findIndex(i => i.id === orgSection) + 1} / {orgNavItems.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = orgNavItems.findIndex(i => i.id === orgSection);
                      if (idx < orgNavItems.length - 1) setOrgSection(orgNavItems[idx + 1].id);
                    }}
                    disabled={orgNavItems[orgNavItems.length - 1].id === orgSection}
                    className="gap-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── PLATFORM FEATURES TAB ── */}
          <TabsContent value="platform">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar */}
              <aside className="lg:w-56 shrink-0">
                <div className="sticky top-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3 mb-2">Sections</p>
                  <SidebarNav
                    items={platformNavItems}
                    active={platformSection}
                    onSelect={setPlatformSection}
                  />
                </div>
              </aside>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                  <PlatformContent section={platformSection} />
                </div>

                {/* Bottom navigation */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = platformNavItems.findIndex(i => i.id === platformSection);
                      if (idx > 0) setPlatformSection(platformNavItems[idx - 1].id);
                    }}
                    disabled={platformNavItems[0].id === platformSection}
                    className="gap-1"
                  >
                    ← Previous
                  </Button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {platformNavItems.findIndex(i => i.id === platformSection) + 1} / {platformNavItems.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = platformNavItems.findIndex(i => i.id === platformSection);
                      if (idx < platformNavItems.length - 1) setPlatformSection(platformNavItems[idx + 1].id);
                    }}
                    disabled={platformNavItems[platformNavItems.length - 1].id === platformSection}
                    className="gap-1"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Bottom CTA ── */}
        <section className="mt-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center text-white shadow-xl">
          <Sparkles className="mx-auto h-10 w-10 text-blue-200 mb-4" />
          {isAuthenticated ? (
            <>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                Head to your dashboard to start exploring everything Recruitify has to offer.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => navigate({ to: isCandidate ? '/candidate/dashboard' : '/organization/dashboard' })}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6"
                >
                  {isCandidate ? <UserCircle className="mr-2 h-4 w-4" /> : <Building2 className="mr-2 h-4 w-4" />}
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate({ to: isCandidate ? '/candidate/jobs' : '/organization/post-vacancy' })}
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 font-semibold px-6"
                >
                  {isCandidate ? 'Browse Jobs →' : 'Post a Vacancy →'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                Join thousands of candidates and organizations already using Recruitify to connect talent with opportunity.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => navigate({ to: '/register/candidate' })}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  Register as Candidate
                </Button>
                <Button
                  onClick={() => navigate({ to: '/register/organization' })}
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 font-semibold px-6"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Register as Organization
                </Button>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
