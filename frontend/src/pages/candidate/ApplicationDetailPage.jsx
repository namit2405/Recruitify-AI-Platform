import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetCandidateApplications,
  useGetVacancy,
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

import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, MessageSquare } from "lucide-react";

export default function ApplicationDetailPage() {
  // Set page title
  usePageTitle('Application Details');
  
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const navigate = useNavigate();

  const candidateId =
    userProfile?.userType === "candidate" ? userProfile.entityId : null;

  const { data: applications = [] } =
    useGetCandidateApplications(candidateId);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "candidate") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 to-green-600/5">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                You haven't applied to any jobs yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationCard
                key={application.applicationId.toString()}
                application={application}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ApplicationCard({ application }) {
  const { data: vacancy } = useGetVacancy(application.vacancyId);

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "submitted":
        return "Under Review";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{vacancy?.title || "Loading..."}</CardTitle>
            <CardDescription>
              {vacancy?.location || "Location not specified"}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(application.status)}>
            {getStatusText(application.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Applied on{" "}
            {new Date(
              Number(application.appliedDate) / 1_000_000
            ).toLocaleDateString()}
          </span>
        </div>

        {application.feedback && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <h4 className="font-semibold text-sm">
                Feedback from Organization
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {application.feedback}
            </p>
          </div>
        )}

        {vacancy && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">
              Job Description
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {vacancy.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
