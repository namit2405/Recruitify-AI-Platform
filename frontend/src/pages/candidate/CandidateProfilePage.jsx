import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetCandidateProfile,
  useUpdateCandidateProfile,
  useRegisterCandidate,
  useUploadCandidateProfilePicture,
  useUploadCandidateCoverPhoto,
  useUploadResume,
} from "../../hooks/useQueries";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ImageUpload from "../../components/ImageUpload";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import { Loader2, Plus, X, FileText, Upload, Eye, Download, Globe, Github, Linkedin, Instagram } from "lucide-react";

export default function CandidateProfilePage() {
  // Set page title
  usePageTitle('My Profile');
  
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const navigate = useNavigate();

  const candidateId =
    userProfile?.userType === "candidate" ? userProfile.entityId : null;

  const { data: candidateProfile, isLoading: candidateLoading } =
    useGetCandidateProfile(candidateId);

  const updateProfile = useUpdateCandidateProfile();
  const registerCandidate = useRegisterCandidate();
  const uploadProfilePicture = useUploadCandidateProfilePicture();
  const uploadCoverPhoto = useUploadCandidateCoverPhoto();
  const uploadResume = useUploadResume();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [availability, setAvailability] = useState("");
  const [summary, setSummary] = useState("");

  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);

  const [experienceInput, setExperienceInput] = useState("");
  const [experience, setExperience] = useState([]);

  const [educationInput, setEducationInput] = useState("");
  const [education, setEducation] = useState([]);

  const [accomplishmentInput, setAccomplishmentInput] = useState("");
  const [accomplishments, setAccomplishments] = useState([]);

  const [preferenceInput, setPreferenceInput] = useState("");
  const [jobPreferences, setJobPreferences] = useState([]);

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  useEffect(() => {
    if (candidateProfile) {
      setName(candidateProfile.name);
      setPhone(candidateProfile.phone || "");
      setAddress(candidateProfile.address || "");
      setAvailability(candidateProfile.availability || "");
      setSummary(candidateProfile.summary || "");
      setSkills(candidateProfile.skills || []);
      setExperience(candidateProfile.experience || []);
      setEducation(candidateProfile.education || []);
      setAccomplishments(candidateProfile.accomplishments || []);
      setJobPreferences(candidateProfile.jobPreferences || []);
      setWebsiteUrl(candidateProfile.website_url || "");
      setGithubUrl(candidateProfile.github_url || "");
      setLinkedinUrl(candidateProfile.linkedin_url || "");
      setInstagramUrl(candidateProfile.instagram_url || "");
    }
  }, [candidateProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Full name and phone number are required.");
      return;
    }

    try {
      if (!candidateId) {
        await registerCandidate.mutateAsync({
          name: name.trim(),
          phone: phone.trim() || '',
          address: address.trim() || '',
          skills,
          experience,
          education,
          accomplishments,
          availability: availability.trim() || '',
          summary: summary.trim() || '',
          jobPreferences,
          website_url: websiteUrl.trim() || '',
          github_url: githubUrl.trim() || '',
          linkedin_url: linkedinUrl.trim() || '',
          instagram_url: instagramUrl.trim() || '',
        });
        toast.success("Profile created successfully!");
      } else {
        await updateProfile.mutateAsync({
          candidateId,
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          skills,
          experience,
          education,
          accomplishments,
          availability: availability.trim() || null,
          summary: summary.trim() || null,
          jobPreferences,
          website_url: websiteUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
        });
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage = error?.body?.detail 
        || error?.body?.message 
        || JSON.stringify(error?.body)
        || error?.message 
        || "Failed to save profile";
      toast.error(errorMessage);
    }
  };

  const addItem = (value, list, setList, setInput) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setInput("");
    }
  };

  const removeItem = (index, list, setList) => {
    setList(list.filter((_, idx) => idx !== index));
  };

  if (candidateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your personal information and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Images */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Profile Images</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Upload your profile picture and cover photo
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ImageUpload
                  currentImageUrl={candidateProfile?.cover_photo_url}
                  onUpload={uploadCoverPhoto.mutateAsync}
                  isUploading={uploadCoverPhoto.isPending}
                  type="cover"
                  label="Cover Photo"
                />

                <ImageUpload
                  currentImageUrl={candidateProfile?.profile_picture_url}
                  onUpload={uploadProfilePicture.mutateAsync}
                  isUploading={uploadProfilePicture.isPending}
                  type="profile"
                  label="Profile Picture"
                />
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Personal Information</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Keep your profile updated to get better job matches
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-900 dark:text-white">Full Name *</Label>
                      <Input 
                        id="name"
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-900 dark:text-white">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-900 dark:text-white">Address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="City, State, Country"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availability" className="text-gray-900 dark:text-white">Availability</Label>
                    <Input
                      id="availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g., Immediate, 2 weeks notice, Remote only"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary" className="text-gray-900 dark:text-white">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                      placeholder="Write a brief summary about yourself, your experience, and career goals..."
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">Social Media & Portfolio</Label>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-gray-900 dark:text-white">Website / Portfolio</Label>
                        <Input
                          id="website"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="github" className="text-gray-900 dark:text-white">GitHub Profile</Label>
                        <Input
                          id="github"
                          type="url"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          placeholder="https://github.com/username"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="text-gray-900 dark:text-white">LinkedIn Profile</Label>
                        <Input
                          id="linkedin"
                          type="url"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-gray-900 dark:text-white">Instagram Profile</Label>
                        <Input
                          id="instagram"
                          type="url"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          placeholder="https://instagram.com/username"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resume Upload Section */}
                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Resume (PDF only)</Label>
                    {candidateProfile?.resume_url ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-8 w-8 text-red-600 dark:text-red-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white">Resume uploaded</p>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {candidateProfile.resume_url.split('/').pop()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(candidateProfile.resume_url, '_blank');
                              }}
                              className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1 sm:flex-none"
                            >
                              <Eye className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = candidateProfile.resume_url;
                                link.download = candidateProfile.resume_url.split('/').pop();
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex-1 sm:flex-none"
                            >
                              <Download className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Label htmlFor="resume-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                              <Upload className="h-4 w-4 flex-shrink-0" />
                              <span>Upload new resume to replace current one</span>
                            </div>
                          </Label>
                          <input
                            id="resume-upload"
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;

                              if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                                toast.error("Only PDF files are allowed.");
                                event.target.value = '';
                                return;
                              }

                              try {
                                await uploadResume.mutateAsync(file);
                                toast.success("Resume uploaded successfully.");
                                event.target.value = '';
                              } catch (error) {
                                console.error("Resume upload error:", error);
                                const errorMessage = error?.body?.detail 
                                  || error?.body?.message 
                                  || error?.message 
                                  || "Failed to upload resume.";
                                toast.error(errorMessage);
                                event.target.value = '';
                              }
                            }}
                            disabled={uploadResume.isPending}
                            className="hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center bg-white dark:bg-gray-800">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                        <div className="space-y-2">
                          <p className="font-medium text-gray-900 dark:text-white">Upload your resume</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            PDF format only, max 10MB
                          </p>
                          <Label htmlFor="resume-upload-initial" className="cursor-pointer inline-block">
                            <div
                              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-9 px-4 py-2 mt-2 text-gray-900 dark:text-white ${uploadResume.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              {uploadResume.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Choose File
                                </>
                              )}
                            </div>
                          </Label>
                        </div>
                        <input
                          id="resume-upload-initial"
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;

                            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                              toast.error("Only PDF files are allowed.");
                              event.target.value = '';
                              return;
                            }

                            try {
                              await uploadResume.mutateAsync(file);
                              toast.success("Resume uploaded successfully.");
                              event.target.value = '';
                            } catch (error) {
                              console.error("Resume upload error:", error);
                              const errorMessage = error?.body?.detail 
                                || error?.body?.message 
                                || error?.message 
                                || "Failed to upload resume.";
                              toast.error(errorMessage);
                              event.target.value = '';
                            }
                          }}
                          disabled={uploadResume.isPending}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(skillInput, skills, setSkills, setSkillInput);
                          }
                        }}
                        placeholder="Add a skill (e.g., Python, React, SQL)"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem(skillInput, skills, setSkills, setSkillInput)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeItem(i, skills, setSkills)}
                            className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Experience</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={experienceInput}
                        onChange={(e) => setExperienceInput(e.target.value)}
                        placeholder="e.g., Software Engineer at ABC Corp (2020-2023)"
                        rows={2}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem(experienceInput, experience, setExperience, setExperienceInput)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {experience.map((exp, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex-1 text-sm text-gray-900 dark:text-white">
                            {typeof exp === 'object' && exp !== null ? (
                              <span>
                                {exp.title || exp.position || 'Role'}
                                {(exp.company || exp.organization) && ` @ ${exp.company || exp.organization}`}
                                {exp.years && ` · ${exp.years} yr${exp.years !== 1 ? 's' : ''}`}
                              </span>
                            ) : String(exp)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(i, experience, setExperience)}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Education</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={educationInput}
                        onChange={(e) => setEducationInput(e.target.value)}
                        placeholder="e.g., Bachelor's in Computer Science, XYZ University (2016-2020)"
                        rows={2}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem(educationInput, education, setEducation, setEducationInput)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {education.map((edu, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex-1 text-sm text-gray-900 dark:text-white">
                            {typeof edu === 'object' && edu !== null ? (
                              <span>
                                {edu.degree || edu.qualification || 'Degree'}
                                {(edu.institution || edu.school) && ` @ ${edu.institution || edu.school}`}
                                {edu.year && ` · ${edu.year}`}
                              </span>
                            ) : String(edu)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(i, education, setEducation)}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Accomplishments</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={accomplishmentInput}
                        onChange={(e) => setAccomplishmentInput(e.target.value)}
                        placeholder="e.g., Top Rated Talent 2023, 8 Completed Contracts with 100% Success Rate"
                        rows={2}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem(accomplishmentInput, accomplishments, setAccomplishments, setAccomplishmentInput)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {accomplishments.map((acc, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="flex-1 text-sm text-gray-900 dark:text-white">{acc}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(i, accomplishments, setAccomplishments)}
                            className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-900 dark:text-white">Job Preferences</Label>
                    <div className="flex gap-2">
                      <Input
                        value={preferenceInput}
                        onChange={(e) => setPreferenceInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addItem(preferenceInput, jobPreferences, setJobPreferences, setPreferenceInput);
                          }
                        }}
                        placeholder="e.g., Remote work, Full-time, Flexible hours"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <Button 
                        type="button" 
                        onClick={() => addItem(preferenceInput, jobPreferences, setJobPreferences, setPreferenceInput)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {jobPreferences.map((pref, i) => (
                        <Badge key={i} variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
                          {pref}
                          <button
                            type="button"
                            onClick={() => removeItem(i, jobPreferences, setJobPreferences)}
                            className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
