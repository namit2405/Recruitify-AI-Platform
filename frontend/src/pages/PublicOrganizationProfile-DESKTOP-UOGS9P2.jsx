import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageLightbox from "../components/ImageLightbox";
import FollowButton from "../components/FollowButton";
import MessageButton from "../components/MessageButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Mail, Globe, Calendar, Building2, Briefcase, DollarSign } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export default function PublicOrganizationProfile() {
  const { id } = useParams({ from: "/public/organization/$id" });
  
  // Set page title
  usePageTitle('Company Profile');
  
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: organization, isLoading } = useQuery({
    queryKey: ["public-organization", id],
    queryFn: () => fetchApi(`/auth/public/organization/${id}/`),
  });

  const { data: vacancies, isLoading: vacanciesLoading } = useQuery({
    queryKey: ["organization-vacancies", id],
    queryFn: async () => {
      return await fetchApi(`/vacancies/?organization=${id}`);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Organization not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500/5 to-blue-600/5">
      <Header />

      <main className="flex-1">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden">
          {organization.cover_photo_url ? (
            <img
              src={organization.cover_photo_url}
              alt="Cover"
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxImage(organization.cover_photo_url)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-24 w-24 text-white/20" />
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Logo & Name */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
              <div 
                className="relative w-40 h-40 rounded-full border-4 border-background bg-background shadow-xl overflow-hidden cursor-pointer group"
                onClick={() => organization.profile_picture_url && setLightboxImage(organization.profile_picture_url)}
              >
                {organization.profile_picture_url ? (
                  <img
                    src={organization.profile_picture_url}
                    alt={organization.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                    <Building2 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white/95 dark:bg-slate-900/95 rounded-lg p-6 shadow-lg backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{organization.name}</h1>
                    <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                      {organization.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{organization.location}</span>
                        </div>
                      )}
                      {organization.website && (
                        <a 
                          href={organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Visit Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {organization.user_id && (
                    <div className="flex flex-col gap-2">
                      <FollowButton userId={organization.user_id} />
                      <MessageButton userId={organization.user_id} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column - Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                    <div className="space-y-3">
                      {organization.contact_email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <a 
                              href={`mailto:${organization.contact_email}`}
                              className="text-sm hover:text-blue-600 transition-colors"
                            >
                              {organization.contact_email}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {organization.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            <a 
                              href={`tel:${organization.phone}`}
                              className="text-sm hover:text-blue-600 transition-colors"
                            >
                              {organization.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {organization.established && (
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Established</p>
                            <p className="text-sm">{organization.established}</p>
                          </div>
                        </div>
                      )}

                      {organization.location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Location</p>
                            <p className="text-sm">{organization.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {organization.website && (
                  <Button 
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <a 
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>

              {/* Right Column - About & Vacancies */}
              <div className="md:col-span-2 space-y-6">
                {/* About */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-semibold mb-4">About {organization.name}</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {organization.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Open Positions */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                      Open Positions
                      {vacancies && vacancies.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {vacancies.length}
                        </Badge>
                      )}
                    </h2>
                    
                    {vacanciesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : vacancies && vacancies.length > 0 ? (
                      <div className="space-y-4">
                        {vacancies.map((vacancy) => (
                          <div 
                            key={vacancy.id}
                            className="p-4 border rounded-lg hover:border-blue-600 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{vacancy.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {vacancy.description}
                                </p>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  {vacancy.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{vacancy.location}</span>
                                    </div>
                                  )}
                                  {vacancy.salary_range && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span>{vacancy.salary_range}</span>
                                    </div>
                                  )}
                                  {vacancy.experience_level && (
                                    <Badge variant="outline" className="text-xs">
                                      {vacancy.experience_level}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                asChild
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Link to="/candidate/jobs">
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No open positions at the moment</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
