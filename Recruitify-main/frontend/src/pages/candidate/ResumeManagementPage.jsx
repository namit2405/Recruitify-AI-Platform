import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetCandidateProfile,
} from "../../hooks/useQueries";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";

export default function ResumeManagementPage() {
  // Set page title
  usePageTitle('Resume Management');
  
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const navigate = useNavigate();

  const candidateId =
    userProfile?.userType === "candidate" ? userProfile.entityId : null;

  const { data: candidateProfile } =
    useGetCandidateProfile(candidateId);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 to-green-600/5">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Resume Management
            </h1>
            <p className="text-muted-foreground">
              Upload and manage your professional resume
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
              <CardDescription>
                Keep your resume up to date to improve your chances
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {candidateProfile?.resumePath ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">Resume.pdf</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Replace
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <img
                    src="/assets/generated/resume-icon.png"
                    alt="Resume"
                    className="h-16 w-16 mx-auto mb-4 opacity-50"
                  />
                  <p className="text-muted-foreground mb-4">
                    No resume uploaded yet
                  </p>
                  <Button
                    disabled
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resume (Coming Soon)
                  </Button>
                </div>
              )}

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-3">
                  Resume Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Keep your resume concise (1–2 pages)</li>
                  <li>• Highlight relevant skills and experience</li>
                  <li>• Use action verbs to describe achievements</li>
                  <li>• Tailor your resume for each application</li>
                  <li>• Proofread carefully for errors</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
