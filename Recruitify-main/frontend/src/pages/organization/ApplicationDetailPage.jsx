import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../../hooks/usePageTitle';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ScheduleInterviewModal from '../../components/ScheduleInterviewModal';
import InterviewDetailsCard from '../../components/InterviewDetailsCard';
import InterviewStatusBadge from '../../components/InterviewStatusBadge';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { toast } from 'sonner';

export default function ApplicationDetailPage() {
  const { slug } = useParams({ from: "/organization/applications/$slug" });
  const navigate = useNavigate();
  
  usePageTitle('Application Details');

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch application details
  const fetchApplication = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/applications/${slug}/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch application');
      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  // Update application status
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/applications/${slug}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error('Failed to update status');
      const data = await response.json();
      setApplication(data);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Cancel interview
  const handleCancelInterview = async () => {
    if (!confirm('Are you sure you want to cancel this interview?')) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/applications/${slug}/cancel-interview/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to cancel interview');

      const data = await response.json();
      setApplication(data.application);
      toast.success('Interview cancelled successfully');
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel interview');
    }
  };

  // Load application on mount
  useEffect(() => {
    fetchApplication();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-96" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Application Not Found</h2>
            <Button onClick={() => navigate({ to: '/organization/dashboard' })}>
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const candidate = application.candidate_details;
  const scoreColor = application.final_score >= 60 ? 'text-green-600' : 
                     application.final_score >= 50 ? 'text-yellow-600' : 
                     'text-red-600';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/organization/candidates' })}
          className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Profile */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">{candidate.name}</CardTitle>
                    <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                      Applied for: {application.vacancy_title}
                    </CardDescription>
                  </div>
                  <InterviewStatusBadge application={application} />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  {candidate.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{candidate.email}</span>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {candidate.summary && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {candidate.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume */}
                {candidate.resume && (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(candidate.resume, '_blank')}
                      className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interview Details */}
            {application.interview_datetime && (
              <InterviewDetailsCard
                application={application}
                onEdit={() => setScheduleModalOpen(true)}
                onCancel={handleCancelInterview}
              />
            )}

            {/* AI Screening Results */}
            {application.ml_result && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    AI Screening Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match Score</span>
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                          {application.final_score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            application.final_score >= 60 ? 'bg-green-600' :
                            application.final_score >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${application.final_score}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <Badge className={
                        application.category === 'highly_preferred' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' :
                        application.category === 'mid_preference' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0'
                      }>
                        {application.category?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Status Management */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={application.status}
                  onValueChange={handleStatusChange}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <SelectItem value="applied" className="text-gray-900 dark:text-white">Applied</SelectItem>
                    <SelectItem value="reviewing" className="text-gray-900 dark:text-white">Reviewing</SelectItem>
                    <SelectItem value="shortlisted" className="text-gray-900 dark:text-white">Shortlisted</SelectItem>
                    <SelectItem value="interview_scheduled" className="text-gray-900 dark:text-white">Interview Scheduled</SelectItem>
                    <SelectItem value="interview_completed" className="text-gray-900 dark:text-white">Interview Completed</SelectItem>
                    <SelectItem value="rejected" className="text-gray-900 dark:text-white">Rejected</SelectItem>
                    <SelectItem value="hired" className="text-gray-900 dark:text-white">Hired</SelectItem>
                  </SelectContent>
                </Select>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Applied: {new Date(application.applied_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Updated: {new Date(application.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Actions */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Interview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!application.interview_datetime ? (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setScheduleModalOpen(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setScheduleModalOpen(true)}
                    >
                      Reschedule
                    </Button>
                    {application.status === 'interview_scheduled' && (
                      <Button
                        variant="outline"
                        className="w-full border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleStatusChange('interview_completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleStatusChange('shortlisted')}
                  disabled={application.status === 'shortlisted' || application.status === 'interview_scheduled' || application.status === 'interview_completed' || application.status === 'hired' || application.status === 'rejected'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {application.status === 'shortlisted' ? '✓ Shortlisted' : 'Shortlist'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={application.status === 'rejected' || application.status === 'hired'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {application.status === 'rejected' ? '✓ Rejected' : 'Reject'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleStatusChange('hired')}
                  disabled={application.status === 'hired' || application.status === 'rejected'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {application.status === 'hired' ? '✓ Hired' : 'Mark as Hired'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        application={application}
        onSuccess={fetchApplication}
      />
    </div>
  );
}
