import { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  UserCircle, 
  FileText, 
  Search, 
  MessageSquare, 
  BarChart3,
  Upload,
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  Mail,
  Bell,
  Settings,
  Eye,
  Heart,
  Trash2,
  Reply
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState('candidate');
  
  // Set page title
  usePageTitle('Documentation');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            How to Use Recruitify
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Complete guide to help you get started with Recruitify, whether you're looking for your dream job or searching for the perfect candidate.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="candidate" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-gray-900 dark:data-[state=inactive]:text-white rounded-lg">
              <UserCircle className="h-4 w-4" />
              For Candidates
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-gray-900 dark:data-[state=inactive]:text-white rounded-lg">
              <Building2 className="h-4 w-4" />
              For Organizations
            </TabsTrigger>
          </TabsList>

          {/* Candidate Guide */}
          <TabsContent value="candidate" className="space-y-6">
            {/* Getting Started */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  Getting Started as a Candidate
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Create your account and set up your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">1</span>
                      Sign Up
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-8">
                      <li>• Click "Register" in the top right corner</li>
                      <li>• Select "I'm a Candidate"</li>
                      <li>• Enter your email and create a password</li>
                      <li>• Verify your email with the OTP sent</li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Registration Page]</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">2</span>
                      Complete Your Profile
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-8">
                      <li>• Add your full name and contact information</li>
                      <li>• Upload a professional profile picture</li>
                      <li>• Add your skills and experience</li>
                      <li>• Upload your resume (PDF format)</li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Profile Setup]</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browse Jobs */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  Finding and Applying for Jobs
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Discover opportunities that match your skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Browse Job Listings</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Navigate to "Browse Jobs" from the dashboard or header menu to see all available positions.
                    </p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Job Listings Page]</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <Search className="h-4 w-4 mb-2 text-blue-500" />
                        <p className="font-medium text-gray-900 dark:text-white">Search & Filter</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Use keywords, location, and filters</p>
                      </div>
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <Eye className="h-4 w-4 mb-2 text-blue-500" />
                        <p className="font-medium text-gray-900 dark:text-white">View Details</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Click on any job to see full description</p>
                      </div>
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <Heart className="h-4 w-4 mb-2 text-blue-500" />
                        <p className="font-medium text-gray-900 dark:text-white">Save Jobs</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Bookmark interesting positions</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Applying for a Job</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">1</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Review Job Requirements</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Make sure you meet the qualifications</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">2</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Click "Apply Now"</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Your profile and resume will be submitted</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">3</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">AI Analysis</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Our AI will analyze your fit for the role</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">4</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Track Your Application</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Monitor status in "My Applications"</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Application Process]</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Applications */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Tracking Your Applications
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Monitor your job application status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View all your applications in one place and track their progress through the hiring process.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Applications Dashboard]</p>
                </div>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800">
                    <Badge variant="secondary" className="mb-2">Pending</Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Under review</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800">
                    <Badge className="mb-2 bg-blue-500">Shortlisted</Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">You're a match!</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800">
                    <Badge className="mb-2 bg-green-600">Accepted</Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Congratulations!</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800">
                    <Badge variant="destructive" className="mb-2">Rejected</Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Keep trying</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat Feature */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  Communicating with Employers
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Chat directly with hiring managers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with employers through our built-in messaging system.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Starting a Conversation</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Visit an organization's profile</li>
                      <li>• Click the "Message" button</li>
                      <li>• Start chatting instantly</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Chat Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Send text messages</li>
                      <li>• Share images and files</li>
                      <li>• Reply to specific messages</li>
                      <li>• Delete your messages</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Chat Interface]</p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Your Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Track your job search progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View insights about your applications, profile views, and success rate.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Candidate Analytics]</p>
                </div>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">24</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Applications Sent</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">156</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Profile Views</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">8</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Shortlisted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Guide */}
          <TabsContent value="organization" className="space-y-6">
            {/* Getting Started */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  Getting Started as an Organization
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Set up your company profile and start hiring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">1</span>
                      Register Your Organization
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-8">
                      <li>• Click "Register" and select "I'm an Employer"</li>
                      <li>• Enter your company email</li>
                      <li>• Create a secure password</li>
                      <li>• Verify your email</li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Organization Registration]</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm">2</span>
                      Build Your Company Profile
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-8">
                      <li>• Add company name and description</li>
                      <li>• Upload company logo and cover photo</li>
                      <li>• Add location and contact details</li>
                      <li>• Describe your company culture</li>
                    </ul>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Company Profile]</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Jobs */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  Posting Job Vacancies
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Create compelling job listings to attract top talent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Creating a Job Posting</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">1</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Navigate to "Post a Job"</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Click the button in your dashboard or header</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">2</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Fill in Job Details</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Title, description, requirements, salary range</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">3</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Add Required Skills</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">List technical and soft skills needed</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm shrink-0">4</span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">Publish Your Vacancy</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Make it live for candidates to see</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Post Job Form]</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <FileText className="h-4 w-4 mb-2 text-blue-500" />
                      <p className="font-medium text-gray-900 dark:text-white">Clear Description</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Write detailed job requirements</p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <Users className="h-4 w-4 mb-2 text-blue-500" />
                      <p className="font-medium text-gray-900 dark:text-white">Target Audience</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Specify experience level</p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <Settings className="h-4 w-4 mb-2 text-blue-500" />
                      <p className="font-medium text-gray-900 dark:text-white">Job Settings</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Set location, type, and salary</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Applications */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Reviewing Applications
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">AI-powered candidate screening and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI analyzes each application and provides a compatibility score based on job requirements.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Applications Review]</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">AI Compatibility Score</h4>
                      <Badge className="bg-blue-500">85%</Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Each candidate receives a score based on skills match, experience, and qualifications.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <p className="font-medium mb-1 text-gray-900 dark:text-white">Strengths</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Key matching skills</p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <p className="font-medium mb-1 text-gray-900 dark:text-white">Weaknesses</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Areas for improvement</p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <p className="font-medium mb-1 text-gray-900 dark:text-white">Recommendation</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">AI hiring suggestion</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Application Actions</h4>
                  <div className="grid md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" className="w-full text-gray-900 dark:text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                    <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Shortlist
                    </Button>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      Accept
                    </Button>
                    <Button variant="destructive" size="sm" className="w-full">
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browse Resumes */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  Browse Candidate Resumes
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Proactively search for talent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search through our database of candidates and reach out to potential hires directly.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Resume Browser]</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <Search className="h-4 w-4 mb-2 text-blue-500" />
                    <p className="font-medium mb-1 text-gray-900 dark:text-white">Advanced Search</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Filter by skills, experience, location</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <MessageSquare className="h-4 w-4 mb-2 text-blue-500" />
                    <p className="font-medium mb-1 text-gray-900 dark:text-white">Direct Contact</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Message candidates instantly</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat & Communication */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  Communicating with Candidates
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Built-in messaging system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chat with candidates directly through our platform with rich messaging features.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Messaging Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        Text messages
                      </li>
                      <li className="flex items-center gap-2">
                        <Upload className="h-3 w-3" />
                        Share files and images
                      </li>
                      <li className="flex items-center gap-2">
                        <Reply className="h-3 w-3" />
                        Reply to messages
                      </li>
                      <li className="flex items-center gap-2">
                        <Trash2 className="h-3 w-3" />
                        Delete messages
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-900 dark:text-white">Best Practices</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Respond promptly to candidates</li>
                      <li>• Be professional and courteous</li>
                      <li>• Share interview details clearly</li>
                      <li>• Provide feedback when possible</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Organization Chat]</p>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Analytics & Insights
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Track your hiring performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor your job postings, applications, and hiring metrics in real-time.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">[Screenshot: Organization Analytics]</p>
                </div>
                <div className="grid md:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">12</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Active Jobs</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">248</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Applications</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">45</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Shortlisted</p>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                    <p className="text-2xl font-bold text-blue-500">8</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Hired</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="h-5 w-5 text-blue-500" />
              Pro Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">For Candidates</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>✓ Keep your profile updated with latest skills</li>
                  <li>✓ Upload a professional, well-formatted resume</li>
                  <li>✓ Apply to jobs that match your qualifications</li>
                  <li>✓ Respond quickly to employer messages</li>
                  <li>✓ Check your dashboard regularly for updates</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">For Organizations</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>✓ Write clear, detailed job descriptions</li>
                  <li>✓ Review applications within 48 hours</li>
                  <li>✓ Use AI insights to identify top candidates</li>
                  <li>✓ Maintain active communication with applicants</li>
                  <li>✓ Keep your company profile attractive and updated</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need Help */}
        <div className="mt-8 text-center p-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Need More Help?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <MessageSquare className="h-4 w-4 mr-2" />
              Live Chat
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
