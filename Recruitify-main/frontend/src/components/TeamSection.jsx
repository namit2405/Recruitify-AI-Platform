import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, LogOut, Loader2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function TeamSection({ organizationId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const { data: teamData, isLoading } = useQuery({
    queryKey: ["team-stats", organizationId],
    queryFn: () => fetchApi(`/auth/team/${organizationId}/`),
  });

  const markLeftMutation = useMutation({
    mutationFn: ({ employmentId, endDate }) =>
      fetchApi(`/auth/employment/${employmentId}/end/`, {
        method: "PATCH",
        body: JSON.stringify({ end_date: endDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-stats", organizationId] });
      toast.success("Employment status updated");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to update employment status");
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (employmentId) =>
      fetchApi(`/auth/employment/${employmentId}/toggle-visibility/`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-stats", organizationId] });
      toast.success("Visibility updated");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to update visibility");
    },
  });

  const handleMarkLeft = (employmentId) => {
    if (confirm("Mark this employee as left?")) {
      const today = new Date().toISOString().split("T")[0];
      markLeftMutation.mutate({ employmentId, endDate: today });
    }
  };

  const isOwner = userProfile?.userType === "organization" && 
                  userProfile?.entityId === parseInt(organizationId);

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentEmployees = teamData?.current_employees || [];
  const currentCount = teamData?.current_employees_count || 0;
  const totalHired = teamData?.total_hired_count || 0;

  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {currentCount}
              </Badge>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentCount} current {currentCount === 1 ? "member" : "members"} • {totalHired} total hired
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <>
            {currentEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
            {currentEmployees.map((employment) => (
              <div
                key={employment.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  employment.is_visible
                    ? 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                    : 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                } transition-colors`}
              >
                <Avatar
                  className="h-12 w-12 cursor-pointer"
                  onClick={() => navigate({ to: `/public/candidate/${employment.candidate_slug}` })}
                >
                  <AvatarImage src={employment.candidate_profile_picture_url} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {employment.candidate_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => navigate({ to: `/public/candidate/${employment.candidate_slug}` })}
                    >
                      {employment.candidate_name}
                    </h4>
                    {!employment.is_visible && isOwner && (
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {employment.position}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Since {new Date(employment.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVisibilityMutation.mutate(employment.id)}
                      disabled={toggleVisibilityMutation.isPending}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                      title={employment.is_visible ? "Hide from public" : "Show on public"}
                    >
                      {toggleVisibilityMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : employment.is_visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkLeft(employment.id)}
                      disabled={markLeftMutation.isPending}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      {markLeftMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-1" />
                          Left
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
