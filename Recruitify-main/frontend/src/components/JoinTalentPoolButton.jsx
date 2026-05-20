import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function JoinTalentPoolButton({ organizationId, className }) {
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();

  // Check if user is a candidate
  const isCandidate = userProfile?.userType === "candidate";

  // Get talent pool status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["talent-pool-status", organizationId],
    queryFn: () => fetchApi(`/auth/talent-pool/status/${organizationId}/`),
    enabled: isCandidate && !!organizationId,
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/auth/talent-pool/join/${organizationId}/`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-pool-status", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["talent-pool-stats", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      toast.success("Joined talent pool successfully!");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to join talent pool");
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/auth/talent-pool/leave/${organizationId}/`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-pool-status", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["talent-pool-stats", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      toast.success("Left talent pool");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to leave talent pool");
    },
  });

  const handleClick = () => {
    if (status?.is_member) {
      if (confirm("Are you sure you want to leave this talent pool?")) {
        leaveMutation.mutate();
      }
    } else {
      joinMutation.mutate();
    }
  };

  // Don't show button if not a candidate
  if (!isCandidate) {
    return null;
  }

  const isLoading = statusLoading || joinMutation.isPending || leaveMutation.isPending;
  const isMember = status?.is_member;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={isMember ? "outline" : "default"}
      className={className || (isMember 
        ? "border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20" 
        : "bg-blue-600 hover:bg-blue-700 text-white"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isMember ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Users className="h-4 w-4 mr-2" />
      )}
      {isMember ? "Joined" : "Join Talent Pool"}
    </Button>
  );
}
