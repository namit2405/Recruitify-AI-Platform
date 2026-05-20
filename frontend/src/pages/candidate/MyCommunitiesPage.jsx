import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, Calendar, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MyCommunitiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageTitle('My Communities');

  const { data: communities, isLoading } = useQuery({
    queryKey: ["my-communities"],
    queryFn: () => fetchApi("/auth/talent-pool/my-communities/"),
  });

  const leaveMutation = useMutation({
    mutationFn: (organizationId) =>
      fetchApi(`/auth/talent-pool/leave/${organizationId}/`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-communities"] });
      toast.success("Left community successfully");
    },
    onError: (error) => {
      toast.error(error?.detail || "Failed to leave community");
    },
  });

  const handleLeave = (organizationId, organizationName) => {
    if (confirm(`Are you sure you want to leave ${organizationName}'s talent pool?`)) {
      leaveMutation.mutate(organizationId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const communitiesList = communities?.communities || [];
  const count = communities?.count || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Communities
          </h1>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>You're part of {count} {count === 1 ? 'community' : 'communities'}</span>
          </div>
        </div>

        {/* Communities Grid */}
        {communitiesList.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Communities Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join talent pools to stay connected with organizations and get notified about new opportunities
              </p>
              <Button
                onClick={() => navigate({ to: "/candidate/jobs" })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Organizations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communitiesList.map((community) => (
              <Card 
                key={community.id} 
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  {/* Organization Logo */}
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate({ to: `/public/organization/${community.organization_slug}` })}
                    >
                      {community.organization_profile_picture_url ? (
                        <img
                          src={community.organization_profile_picture_url}
                          alt={community.organization_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Member
                    </Badge>
                  </div>

                  {/* Organization Name */}
                  <h3 
                    className="text-lg font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => navigate({ to: `/public/organization/${community.organization_slug}` })}
                  >
                    {community.organization_name}
                  </h3>

                  {/* Join Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(community.joined_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: `/public/organization/${community.organization_slug}` })}
                      className="flex-1 text-gray-900 dark:text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeave(community.organization_id, community.organization_name)}
                      disabled={leaveMutation.isPending}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      {leaveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        {communitiesList.length > 0 && (
          <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Stay Connected
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    You'll receive notifications when these organizations post new job openings that match your profile. 
                    Keep your profile updated to get the best opportunities!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
