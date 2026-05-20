import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageLightbox from "../components/ImageLightbox";
import FollowButton from "../components/FollowButton";
import MessageButton from "../components/MessageButton";
import TeamSection from "../components/TeamSection";
import JoinTalentPoolButton from "../components/JoinTalentPoolButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Mail, Globe, Calendar, Building2, Briefcase, DollarSign, Users, Award, TrendingUp, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export default function PublicOrganizationProfile() {
  const { slug } = useParams({ from: "/public/organization/$slug" });
  
  usePageTitle('Company Profile');
  
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ["public-organization", slug],
    queryFn: () => fetchApi(`/auth/public/organization/${slug}/`),
    retry: false,
  });

  const organizationId = organization?.id;

  const { data: vacancies, isLoading: vacanciesLoading } = useQuery({
    queryKey: ["organization-vacancies", organizationId],
    queryFn: async () => {
      return await fetchApi(`/vacancies/?organization=${organizationId}`);
    },
    enabled: !!organizationId,
  });

  const { data: teamStats } = useQuery({
    queryKey: ["team-stats", organizationId],
    queryFn: () => fetchApi(`/auth/team/${organizationId}/`),
    enabled: !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !organization) {
    // Extract error message from the error object
    const errorMessage = error?.body?.detail || error?.message || 'Organization not found';
    const isPrivacyError = errorMessage.includes('private') || errorMessage.includes('connections');
    
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                {isPrivacyError ? (
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isPrivacyError ? 'Profile Not Accessible' : 'Organization Not Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {errorMessage}
              </p>
              {isPrivacyError && (
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="mb-2">This profile has restricted visibility settings.</p>
                  {errorMessage.includes('connections') && (
                    <p>Try connecting with this organization to view their profile.</p>
                  )}
                </div>
              )}
              <Button
                onClick={() => window.history.back()}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Profile Card */}
          <Card className="mb-6 overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {/* Cover Photo */}
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-cyan-600">
              {organization.cover_photo_url ? (
                <img
                  src={organization.cover_photo_url}
                  alt="Cover"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(organization.cover_photo_url)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-cyan-600" />
              )}
            </div>

            <CardContent className="pt-0 px-6 pb-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 relative">
                {/* Logo */}
                <div 
                  className="relative w-32 h-32 rounded-lg border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xl overflow-hidden cursor-pointer group flex-shrink-0"
                  onClick={() => organization.profile_picture_url && setLightboxImage(organization.profile_picture_url)}
                >
                  {organization.profile_picture_url ? (
                    <img
                      src={organization.profile_picture_url}
                      alt={organization.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                      <Building2 className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>

                {/* Name and Info */}
                <div className="flex-1 pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-lg backdrop-blur-sm">
                          {organization.name}
                        </h1>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      {organization.established && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 px-2 py-0.5 rounded inline-block backdrop-blur-sm">
                          Established {organization.established}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {organization.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{organization.location}</span>
                      </div>
                    )}
                    {organization.website && (
                      <a 
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Globe className="h-4 w-4 text-blue-500" />
                        <span>{organization.website}</span>
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {organization.user_id && (
                    <div className="flex flex-wrap items-center gap-3">
                      <MessageButton userId={organization.user_id} className="bg-blue-600 hover:bg-blue-700 text-white" />
                      <FollowButton userId={organization.user_id} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    {organization.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Location</p>
                          <p className="text-sm text-gray-900 dark:text-white">{organization.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {organization.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Website</p>
                          <a 
                            href={organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {organization.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {organization.contact_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Email</p>
                          <a 
                            href={`mailto:${organization.contact_email}`}
                            className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
                          >
                            {organization.contact_email}
                          </a>
                        </div>
                      </div>
                    )}

                    {organization.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Phone</p>
                          <a 
                            href={`tel:${organization.phone}`}
                            className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {organization.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {organization.established && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Founded</p>
                          <p className="text-sm text-gray-900 dark:text-white">{organization.established}</p>
                        </div>
                      </div>
                    )}

                    {teamStats && (
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Team Size</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {teamStats.current_employees_count} {teamStats.current_employees_count === 1 ? 'Employee' : 'Employees'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {organization.website && (
                <Button 
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <a 
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit Company Website
                  </a>
                </Button>
              )}

              {/* Hiring Section */}
              <Card className="border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    Hiring at {organization.name}?
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                    Join our talent network to get notified about new openings that match your skills.
                  </p>
                  <JoinTalentPoolButton 
                    organizationId={organizationId} 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* About */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About {organization.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap mb-6">
                    {organization.description}
                  </p>

                  {/* Stats removed - should use real data from backend */}
                </CardContent>
              </Card>

              {/* Team Section */}
              <TeamSection organizationId={organizationId} />

              {/* Open Positions */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      Open Positions
                      {vacancies && vacancies.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {vacancies.length}
                        </Badge>
                      )}
                    </h2>
                    <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option>Sort by: Newest First</option>
                      <option>Sort by: Oldest First</option>
                      <option>Sort by: Salary</option>
                    </select>
                  </div>
                  
                  {vacanciesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : vacancies && vacancies.length > 0 ? (
                    <div className="space-y-4">
                      {vacancies.map((vacancy) => (
                        <div 
                          key={vacancy.id}
                          className="p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                                {vacancy.title}
                              </h3>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{vacancy.experience_level || 'Full-time'}</span>
                                </div>
                                {vacancy.salary_range && (
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    <span>{vacancy.salary_range}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs whitespace-nowrap text-gray-900 dark:text-white">
                              {vacancy.experience_level || 'Expert'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Button 
                              asChild
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400"
                            >
                              <Link to="/candidate/jobs">
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {vacancies.length > 3 && (
                        <Button 
                          asChild
                          variant="link" 
                          className="w-full text-blue-600 dark:text-blue-400"
                        >
                          <Link to="/candidate/jobs">
                            View All {vacancies.length} Job Openings →
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">No open positions at the moment</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check back later for new opportunities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
