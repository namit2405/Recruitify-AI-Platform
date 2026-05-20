import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useGetCallerUserProfile } from "../../hooks/useQueries";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, TrendingUp, Calendar, Mail, MapPin, Award } from "lucide-react";

export default function TalentPoolPage() {
  const navigate = useNavigate();
  usePageTitle('Talent Pool');

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const organizationId = userProfile?.userType === "organization" ? userProfile.entityId : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "organization") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["talent-pool-members", organizationId, searchQuery, skillFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (skillFilter) params.append('skill', skillFilter);
      return fetchApi(`/auth/talent-pool/members/${organizationId}/?${params.toString()}`);
    },
    enabled: !!organizationId,
  });

  const { data: stats } = useQuery({
    queryKey: ["talent-pool-stats", organizationId],
    queryFn: () => fetchApi(`/auth/talent-pool/stats/${organizationId}/`),
    enabled: !!organizationId,
  });

  if (profileLoading || membersLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-64" />
        </main>
        <Footer />
      </div>
    );
  }

  const members = membersData?.members || [];
  const memberCount = membersData?.count || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Talent Pool
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your community of interested candidates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_members || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New This Month</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    +{stats?.new_members_30_days || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.total_members > 0 
                      ? Math.round((stats.new_members_30_days / stats.total_members) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="md:w-64">
                <input
                  type="text"
                  placeholder="Filter by skill..."
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        {members.length === 0 ? (
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || skillFilter ? 'No Members Found' : 'No Members Yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || skillFilter 
                  ? 'Try adjusting your search or filters'
                  : 'Share your profile to encourage candidates to join your talent pool'
                }
              </p>
              {!searchQuery && !skillFilter && (
                <Button
                  onClick={() => navigate({ to: "/organization/vacancies" })}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Post a Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>

            <div className="space-y-4">
              {members.map((member) => (
                <Card 
                  key={member.id} 
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Avatar */}
                      <div 
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl cursor-pointer flex-shrink-0"
                        onClick={() => navigate({ to: `/public/candidate/${member.candidate_slug}` })}
                      >
                        {member.candidate_profile_picture_url ? (
                          <img
                            src={member.candidate_profile_picture_url}
                            alt={member.candidate_name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          member.candidate_name?.charAt(0) || '?'
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Link
                              to={`/public/candidate/${member.candidate_slug}`}
                              className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {member.candidate_name}
                            </Link>
                            {member.candidate_availability && (
                              <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                {member.candidate_availability}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {member.candidate_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{member.candidate_email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Skills */}
                        {member.candidate_skills && member.candidate_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {member.candidate_skills.slice(0, 5).map((skill, i) => (
                              <Badge 
                                key={i} 
                                variant="secondary"
                                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {member.candidate_skills.length > 5 && (
                              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700">
                                +{member.candidate_skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate({ to: `/public/candidate/${member.candidate_slug}` })}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Info Card */}
        {members.length > 0 && (
          <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Engage Your Community
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    When you post a new job, all talent pool members will be notified automatically. 
                    Keep your community engaged by posting relevant opportunities!
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
