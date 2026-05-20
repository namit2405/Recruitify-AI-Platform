import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { usePageTitle } from '../hooks/usePageTitle';
import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import {
  Building2, Users, Briefcase, TrendingUp, CheckCircle,
  ArrowRight, Zap, Shield, BarChart3, Star, ChevronRight,
  Brain, Target, Clock, Globe, Sparkles, Play,
} from 'lucide-react';

/* ─── Animated counter hook ─── */
function useCounter(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ─── Intersection observer hook ─── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Scroll-reveal hook: adds .in-view class when element enters viewport ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('in-view'); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ─── Staggered children reveal: adds .in-view to each child with a delay ─── */
function useStaggerReveal(threshold = 0.1) {
  const ref = useRef(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = Array.from(container.children);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach((child, i) => {
            setTimeout(() => child.classList.add('in-view'), i * 120);
          });
          obs.unobserve(container);
        }
      },
      { threshold }
    );
    obs.observe(container);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ─── Stat card ─── */
function StatCard({ value, suffix, label, transitionDelay = '0s' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const count = useCounter(value, 1600, inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          el.classList.add('in-view');
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center reveal" style={{ transitionDelay }}>
      <div className="text-4xl md:text-5xl font-black text-white mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-200 text-sm font-medium">{label}</div>
    </div>
  );
}

/* ─── Feature card ─── */
function FeatureCard({ icon: Icon, color, title, desc, checks }) {
  return (
    <div
      className="group hover-lift tilt-card rounded-2xl p-8 reveal"
      style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
    >
      <div className={`feature-icon-wrap w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg`}>
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5">{desc}</p>
      <ul className="space-y-2">
        {checks.map((c, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({ num, icon: Icon, title, desc }) {
  return (
    <div className="relative reveal">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-110 hover:rotate-3">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 flex items-center justify-center text-xs font-black text-blue-600">
            {num}
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Testimonial card ─── */
function TestimonialCard({ quote, name, role, avatar }) {
  return (
    <div
      className="tilt-card rounded-2xl p-6 reveal"
      style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 transition-transform duration-200 hover:scale-125" />
        ))}
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${avatar} flex items-center justify-center text-white font-bold text-sm transition-transform duration-300 hover:scale-110`}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── How It Works section ─── */
function HowItWorksSection() {
  const headRef = useScrollReveal(0.2);
  const stepsRef = useStaggerReveal(0.1);
  return (
    <section className="py-28 px-4 bg-white dark:bg-gray-950">
      <div className="container mx-auto">
        <div ref={headRef} className="text-center mb-20 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4 animate-badge-pop">
            <Zap className="h-4 w-4" /> How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Hire in 3 Simple Steps
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            From posting a job to making an offer — our AI handles the heavy lifting.
          </p>
        </div>
        <div ref={stepsRef} className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto relative">
          {/* Animated connector line */}
          <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-0.5 overflow-hidden rounded-full">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 step-line" />
          </div>
          <StepCard num="1" icon={Target}      title="Post Your Role"    desc="Describe the position with our smart form. AI auto-generates structured job requirements." />
          <StepCard num="2" icon={Brain}       title="AI Matches Talent" desc="Our engine scores every applicant against your requirements in seconds, not days." />
          <StepCard num="3" icon={CheckCircle} title="Interview & Hire"  desc="Schedule interviews, send offers, and onboard — all from one dashboard." />
        </div>
      </div>
    </section>
  );
}

/* ─── For Employers section ─── */
function ForEmployersSection({ navigate }) {
  const headRef = useScrollReveal(0.2);
  const cardsRef = useStaggerReveal(0.1);
  const ctaRef = useScrollReveal(0.3);
  return (
    <section className="py-28 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto">
        <div ref={headRef} className="text-center mb-20 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
            <Building2 className="h-4 w-4" /> For Employers
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Build Your Dream Team
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Everything you need to find, evaluate, and hire the best talent — in one place.
          </p>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            title="Intelligent Sourcing"
            desc="AI algorithms surface the best passive and active candidates based on skill proximity and cultural fit."
            checks={['Global Talent Network', 'Automated Skill Assessment', 'Custom Pipeline Stages']}
          />
          <FeatureCard
            icon={BarChart3}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            title="Collaborative Hiring"
            desc="Bring your whole team into the loop with shared scorecards, feedback loops, and calendar syncing."
            checks={['Real-time Interview Notes', 'Team Consensus Scoring', 'Google Meet Integration']}
          />
          <FeatureCard
            icon={TrendingUp}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
            title="Talent Analytics"
            desc="Make data-driven decisions with deep insights into your recruitment ROI and time-to-hire trends."
            checks={['Diversity & Inclusion Tracking', 'Predictive Hiring Models', 'Executive Reports']}
          />
        </div>
        <div ref={ctaRef} className="text-center mt-14 reveal">
          <Button
            size="lg"
            onClick={() => navigate({ to: '/register/organization' })}
            className="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            Start Hiring Today
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── For Candidates section ─── */
function ForCandidatesSection({ navigate }) {
  const headRef = useScrollReveal(0.2);
  const cardsRef = useStaggerReveal(0.1);
  const ctaRef = useScrollReveal(0.3);
  return (
    <section className="py-28 px-4 bg-white dark:bg-gray-950">
      <div className="container mx-auto">
        <div ref={headRef} className="text-center mb-20 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-4">
            <Briefcase className="h-4 w-4" /> For Professionals
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Accelerate Your Career
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Find opportunities that align with your goals and let AI do the matching for you.
          </p>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={Briefcase}
            color="bg-gradient-to-br from-emerald-500 to-green-600"
            title="Smart Job Search"
            desc="Our recommendation engine learns your preferences to deliver high-quality matches that fit your trajectory."
            checks={['Personalized Daily Matches', 'Salary Transparency', 'Hidden Job Market Access']}
          />
          <FeatureCard
            icon={Shield}
            color="bg-gradient-to-br from-teal-500 to-cyan-600"
            title="Pro Profile Builder"
            desc="Stand out with a rich digital portfolio that highlights your projects, certifications, and achievements."
            checks={['Skill Verification Badges', 'Portfolio Import Tools', 'AI Resume Optimization']}
          />
          <FeatureCard
            icon={Clock}
            color="bg-gradient-to-br from-lime-500 to-green-600"
            title="Application Tracking"
            desc="Never lose track of an application. Get real-time status updates and direct feedback from hiring managers."
            checks={['Status Change Notifications', 'Interview Scheduling', 'Direct Messaging']}
          />
        </div>
        <div ref={ctaRef} className="text-center mt-14 reveal">
          <Button
            size="lg"
            onClick={() => navigate({ to: '/register/candidate' })}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
          >
            Find Your Next Role
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials section ─── */
function TestimonialsSection() {
  const headRef = useScrollReveal(0.2);
  const cardsRef = useStaggerReveal(0.1);
  return (
    <section className="py-28 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto">
        <div ref={headRef} className="text-center mb-20 reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-semibold mb-4">
            <Star className="h-4 w-4 fill-yellow-500" /> Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Loved by Teams Worldwide
          </h2>
        </div>
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <TestimonialCard
            quote="We cut our time-to-hire from 6 weeks to 12 days. The AI matching is genuinely impressive — it surfaces candidates we would have missed entirely."
            name="Sarah Chen"
            role="Head of Talent, NovaTech"
            avatar="bg-gradient-to-br from-blue-500 to-purple-500"
          />
          <TestimonialCard
            quote="I landed my dream job within 3 weeks of signing up. The skill gap analysis showed me exactly what to improve, and the interview scheduling was seamless."
            name="Marcus Williams"
            role="Senior Engineer, hired via Recruitify"
            avatar="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <TestimonialCard
            quote="The analytics dashboard alone is worth it. We finally have visibility into our entire pipeline and can make data-driven decisions about where to invest."
            name="Priya Sharma"
            role="VP People, CloudSphere Inc."
            avatar="bg-gradient-to-br from-orange-500 to-pink-500"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── CTA section ─── */
function CtaSection({ navigate }) {
  const contentRef = useScrollReveal(0.2);
  return (
    <section className="py-28 px-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl animate-orb pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '-4s' }} />
      {/* Extra orb for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-700/10 blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '-7s' }} />

      <div className="container mx-auto relative z-10 text-center">
        <div ref={contentRef} className="max-w-3xl mx-auto reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-8 cta-badge">
            <Globe className="h-4 w-4" />
            Join 2,500+ companies already hiring smarter
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight" style={{ transitionDelay: '0.1s' }}>
            Ready to Transform
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 35%, #67e8f9 65%, #60a5fa 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
              }}
            >Your Hiring?</span>
          </h2>
          <p className="text-xl text-blue-200/70 mb-12">
            Get started for free. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/register/organization' })}
              className="group bg-white text-blue-700 hover:bg-blue-50 px-10 py-6 text-base font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              Post a Job — It's Free
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: '/browse-jobs' })}
              className="group border border-white/30 text-white hover:bg-white/10 px-10 py-6 text-base font-semibold rounded-xl backdrop-blur-sm transition-all"
            >
              Browse Open Roles
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userProfile } = useGetCallerUserProfile();
  usePageTitle('Home');

  useEffect(() => {
    if (user && userProfile) {
      if (userProfile.userType === 'organization') navigate({ to: '/organization/dashboard' });
      else if (userProfile.userType === 'candidate') navigate({ to: '/candidate/dashboard' });
    }
  }, [user, userProfile, navigate]);

  const [heroRef, heroInView] = useInView(0.1);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl animate-orb pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl animate-orb pointer-events-none" style={{ animationDelay: '-5s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="container mx-auto px-4 relative z-10 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div className="space-y-8">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium animate-fade-up`}>
                <Sparkles className="h-4 w-4" />
                AI-Powered Recruitment Platform
              </div>

              {/* Heading */}
              <div className="animate-fade-up delay-100">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                  <span className="text-white">Where</span>
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(90deg, #60a5fa 0%, #a78bfa 35%, #67e8f9 65%, #60a5fa 100%)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'shimmer 4s linear infinite',
                    }}
                  >Talent Meets</span>
                  <br />
                  <span className="text-white">Opportunity</span>
                </h1>
              </div>

              <p className="text-lg text-blue-100/70 max-w-lg leading-relaxed animate-fade-up delay-200">
                Recruitify uses AI to match top-tier professionals with the right companies — faster, smarter, and more accurately than any traditional platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
                <Button
                  size="lg"
                  onClick={() => navigate({ to: '/register/organization' })}
                  className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Start Hiring
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ to: '/browse-jobs' })}
                  className="group border border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl backdrop-blur-sm transition-all duration-300"
                >
                  <Play className="mr-2 h-4 w-4 fill-white" />
                  Browse Jobs
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 pt-2 animate-fade-up delay-400">
                <div className="flex -space-x-3">
                  {['bg-blue-500','bg-purple-500','bg-emerald-500','bg-orange-500','bg-pink-500'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-blue-200/70 text-xs">Trusted by 2,500+ companies worldwide</p>
                </div>
              </div>
            </div>

            {/* Right — floating dashboard mockup */}
            <div className="relative animate-scale-in delay-300 hidden lg:block">
              {/* Main card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/50 border border-white/10">
                <img src="/images/hero-homepage.avif" alt="Platform preview" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-8 top-1/4 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Hiring Speed</p>
                    <p className="text-sm font-bold text-white">+45% faster</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-6 top-1/3 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-xl animate-float delay-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">AI Match Score</p>
                    <p className="text-sm font-bold text-white">94% accuracy</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 left-1/4 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl p-4 shadow-xl animate-float delay-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Active Candidates</p>
                    <p className="text-sm font-bold text-white">12,400+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="white" className="dark:fill-gray-950" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        {/* Animated dot grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        {/* Floating particles */}
        {[
          { size: 10, top: '15%', left: '8%',  color: 'rgba(255,255,255,0.25)', dur: '7s',  delay: '0s'   },
          { size: 6,  top: '70%', left: '15%', color: 'rgba(255,255,255,0.18)', dur: '5s',  delay: '-2s'  },
          { size: 14, top: '30%', left: '80%', color: 'rgba(255,255,255,0.2)',  dur: '9s',  delay: '-4s'  },
          { size: 8,  top: '75%', left: '70%', color: 'rgba(255,255,255,0.22)', dur: '6s',  delay: '-1s'  },
          { size: 12, top: '50%', left: '50%', color: 'rgba(255,255,255,0.12)', dur: '11s', delay: '-3s'  },
          { size: 5,  top: '20%', left: '60%', color: 'rgba(255,255,255,0.3)',  dur: '8s',  delay: '-5s'  },
        ].map((p, i) => (
          <div
            key={i}
            className="stat-particle"
            style={{
              width: p.size, height: p.size,
              top: p.top, left: p.left,
              background: p.color,
              '--dur': p.dur,
              '--delay': p.delay,
            }}
          />
        ))}
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <StatCard value={2500}  suffix="+"  label="Companies Hiring"    transitionDelay="0.1s" />
            <StatCard value={48000} suffix="+"  label="Jobs Filled"         transitionDelay="0.2s" />
            <StatCard value={94}    suffix="%"  label="Match Accuracy"      transitionDelay="0.3s" />
            <StatCard value={3}     suffix="x"  label="Faster Time-to-Hire" transitionDelay="0.4s" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <HowItWorksSection />

      {/* ── FOR EMPLOYERS ── */}
      <ForEmployersSection navigate={navigate} />

      {/* ── FOR CANDIDATES ── */}
      <ForCandidatesSection navigate={navigate} />

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── FINAL CTA ── */}
      <CtaSection navigate={navigate} />

      <Footer />
    </div>
  );
}
