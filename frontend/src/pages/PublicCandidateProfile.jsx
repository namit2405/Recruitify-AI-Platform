import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchApi, fixMediaUrl } from "@/lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImageLightbox from "../components/ImageLightbox";
import FollowButton from "../components/FollowButton";
import MessageButton from "../components/MessageButton";
import CurrentEmployment from "../components/CurrentEmployment";
import UserPostsFeed from "../components/UserPostsFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Phone, Mail, Globe, Briefcase, GraduationCap, Award, CheckCircle, Users, Github, Linkedin, Instagram } from "lucide-react";
import { useState } from "react";

export default function PublicCandidateProfile() {
  const { slug } = useParams({ from: "/public/candidate/$slug" });
  
  usePageTitle('Candidate Profile');
  
  const [lightboxImage, setLightboxImage] = useState(null);

  const { data: candidate, isLoading, error } = useQuery({
    queryKey: ["public-candidate", slug],
    queryFn: () => fetchApi(`/auth/public/candidate/${slug}/`),
    retry: false,
  });

  const candidateId = candidate?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !candidate) {
    // Extract error message from the error object
    const errorMessage = error?.body?.detail || error?.message || 'Candidate not found';
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
                    <Users className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isPrivacyError ? 'Profile Not Accessible' : 'Profile Not Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {errorMessage}
              </p>
              {isPrivacyError && (
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="mb-2">This profile has restricted visibility settings.</p>
                  {errorMessage.includes('connections') && (
                    <p>Try connecting with this user to view their profile.</p>
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
            <div className="relative h-48 bg-gradient-to-r from-blue-600 to-purple-600">
              {candidate.cover_photo_url ? (
                <img
                  src={fixMediaUrl(candidate.cover_photo_url)}
                  alt="Cover"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(fixMediaUrl(candidate.cover_photo_url))}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" />
              )}
            </div>

            <CardContent className="pt-0 px-6 pb-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 relative">
                {/* Avatar */}
                <div 
                  className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xl overflow-hidden cursor-pointer group flex-shrink-0"
                  onClick={() => candidate.profile_picture_url && setLightboxImage(fixMediaUrl(candidate.profile_picture_url))}
                >
                  {candidate.profile_picture_url ? (
                    <img
                      src={fixMediaUrl(candidate.profile_picture_url)}
                      alt={candidate.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                      <span className="text-4xl font-bold text-white">
                        {candidate.name?.charAt(0) || "C"}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>

                {/* Name and Info */}
                <div className="flex-1 pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-lg backdrop-blur-sm">
                          {candidate.name}
                        </h1>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Candidate
                        </Badge>
                      </div>
                      {candidate.availability && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          {candidate.availability}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {candidate.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>{candidate.email}</span>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span>{candidate.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links */}
                  {(candidate.website_url || candidate.github_url || candidate.linkedin_url || candidate.instagram_url) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {candidate.website_url && (
                        <a
                          href={candidate.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Website</span>
                        </a>
                      )}
                      {candidate.github_url && (
                        <a
                          href={candidate.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors text-white"
                        >
                          <Github className="h-4 w-4" />
                          <span className="text-sm">GitHub</span>
                        </a>
                      )}
                      {candidate.linkedin_url && (
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span className="text-sm">LinkedIn</span>
                        </a>
                      )}
                      {candidate.instagram_url && (
                        <a
                          href={candidate.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-colors text-white"
                        >
                          <Instagram className="h-4 w-4" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {candidate.user_id && (
                    <div className="flex flex-wrap items-center gap-3">
                      <MessageButton userId={candidate.user_id} className="bg-blue-600 hover:bg-blue-700 text-white" />
                      <FollowButton userId={candidate.user_id} />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Left Column */}
            <div className="space-y-4 md:sticky md:top-4 h-fit">
              {/* Professional Summary */}
              {candidate.summary && (
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Professional Summary
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {candidate.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Expertise & Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(candidate.skills) ? candidate.skills : [candidate.skills]).map((skill, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Preferences */}
              {candidate.job_preferences && candidate.job_preferences.length > 0 && (
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Job Preferences
                    </h2>
                    <div className="space-y-2">
                      {candidate.job_preferences.map((pref, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span>{pref}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Current Employment */}
              <CurrentEmployment candidateId={candidateId} employments={candidate.current_employments} />

              {/* Experience + Education side by side */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Work Experience */}
                {candidate.experience && candidate.experience.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-500" />
                        Work Experience
                      </h2>
                      <div className="space-y-4">
                        {candidate.experience.map((exp, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-9 h-9 rounded bg-gray-900 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <Briefcase className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {typeof exp === "object" && exp !== null ? (
                                <>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {exp.title || exp.position || "Role"}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {exp.company || exp.organization || ""}
                                    {exp.years ? ` · ${exp.years} yr${exp.years !== 1 ? "s" : ""}` : ""}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{String(exp)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {candidate.education && candidate.education.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardContent className="pt-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                        Education
                      </h2>
                      <div className="space-y-4">
                        {candidate.education.map((edu, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-9 h-9 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {typeof edu === "object" && edu !== null ? (
                                <>
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                    {edu.degree || edu.qualification || "Degree"}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {edu.institution || edu.school || ""}
                                    {edu.year ? ` · ${edu.year}` : ""}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{String(edu)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Accomplishments — full width */}
              {candidate.accomplishments && candidate.accomplishments.length > 0 && (
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Accomplishments
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {candidate.accomplishments.map((acc, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                          <Award className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{acc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Posts & Activity — full width below the 3-col grid */}
          {candidate.user_id && (
            <Card className="mt-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                  Posts & Activity
                </h2>
                <UserPostsFeed userId={candidate.user_id} />
              </CardContent>
            </Card>
          )}
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
