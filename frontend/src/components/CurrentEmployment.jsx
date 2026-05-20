import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, LogOut, Loader2, Building2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function CurrentEmployment({ candidateId, employments }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const [isExpanded, setIsExpanded] = useState(true);

  const markLeftMutation = useMutation({
    mutationFn: ({ employmentId, endDate }) =>
      fetchApi(`/auth/employment/${employmentId}/end/`, {
        method: "PATCH",
        body: JSON.stringify({ end_date: endDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-candidate", candidateId] });
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
      queryClient.invalidateQueries({ queryKey: ["public-candidate", candidateId] });
      toast.success("Visibility updated");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to update visibility");
    },
  });

  const handleMarkLeft = (employmentId) => {
    if (confirm("Mark this employment as ended?")) {
      const today = new Date().toISOString().split("T")[0];
      markLeftMutation.mutate({ employmentId, endDate: today });
    }
  };

  const isOwnProfile = userProfile?.userType === "candidate" && 
                       userProfile?.entityId === parseInt(candidateId);

  // Show all employments to owner, only visible ones to others
  const displayEmployments = isOwnProfile 
    ? employments 
    : employments?.filter(emp => emp.is_visible);

  if (!displayEmployments || displayEmployments.length === 0) {
    return null; // Don't show section if no employment to display
  }

  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            Current Employment
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {displayEmployments.length}
            </Badge>
            {isOwnProfile && displayEmployments.length !== employments.length && (
              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
                {employments.length - displayEmployments.length} hidden
              </Badge>
            )}
          </h2>
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
          <div className="space-y-3">
          {displayEmployments.map((employment) => (
            <div
              key={employment.id}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                employment.is_visible 
                  ? 'border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
                  : 'border-orange-200 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {employment.position}
                    </h3>
                    <p
                      className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => navigate({ to: `/public/organization/${employment.organization_slug}` })}
                    >
                      {employment.organization_name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Current
                    </Badge>
                    {!employment.is_visible && isOwnProfile && (
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        Hidden
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Since {new Date(employment.start_date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                {isOwnProfile && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVisibilityMutation.mutate(employment.id)}
                      disabled={toggleVisibilityMutation.isPending}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                    >
                      {toggleVisibilityMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : employment.is_visible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show
                        </>
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
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-1" />
                          Mark as Left
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
