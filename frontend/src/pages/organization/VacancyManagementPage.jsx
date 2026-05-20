import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";

import {
  useGetCallerUserProfile,
  useGetVacanciesByOrganization,
  useUpdateVacancyStatus,
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
import { Badge } from "@/components/ui/badge";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Clock,
  MapPin,
  IndianRupee,
  Lock,
  Unlock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

export default function VacancyManagementPage() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Manage Vacancies');

  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const updateStatus = useUpdateVacancyStatus();

  const organizationId =
    userProfile?.userType === "organization"
      ? userProfile.entityId
      : null;

  const { data: vacancies = [], isLoading: vacanciesLoading } =
    useGetVacanciesByOrganization(organizationId);

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "organization") {
      navigate({ to: "/" });
    }
  }, [userProfile, profileLoading, navigate]);

  const openVacancies = vacancies.filter(
    (v) => v.status === "open"
  );
  const closedVacancies = vacancies.filter(
    (v) => v.status === "closed"
  );

  const handleToggleStatus = async (vacancySlug, currentStatus) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      await updateStatus.mutateAsync({
        slug: vacancySlug,
        status: newStatus,
      });

      toast.success(
        `Vacancy ${
          newStatus === "open" ? "opened" : "closed"
        } successfully`
      );
    } catch (error) {
      toast.error(
        error?.message || "Failed to update vacancy status"
      );
    }
  };

  const VacancyCard = ({ vacancy }) => {
    const applicationCount = vacancy.application_count || 0;
    
    return (
      <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {vacancy.title}
                </h3>
                <Badge
                  className={
                    vacancy.status === "open"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-0"
                  }
                >
                  {vacancy.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Posted on {new Date(vacancy.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <DropdownMenuItem 
                  onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
                  className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
                  className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Vacancy
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleToggleStatus(vacancy.slug, vacancy.status)}
                  className="cursor-pointer text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {vacancy.status === 'open' ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Close Vacancy
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Open Vacancy
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this vacancy?')) {
                      toast.error('Delete functionality coming soon');
                    }
                  }}
                  className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Vacancy
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
            {vacancy.description}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
            {vacancy.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {vacancy.location}
              </span>
            )}
            {vacancy.salary_range && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                {vacancy.salary_range}
              </span>
            )}
            {vacancy.experience_level && (
              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
                {vacancy.experience_level}
              </Badge>
            )}
            {vacancy.is_public ? (
              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 gap-1 text-gray-900 dark:text-white">
                <Unlock className="h-3 w-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 gap-1 text-gray-900 dark:text-white">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Application Stats */}
          <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                Total Applications
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {applicationCount}
                </p>
                <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              size="sm"
              onClick={() => navigate({ to: `/vacancy/${vacancy.slug}` })}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ 
                to: "/organization/candidates",
                search: { vacancy: vacancy.slug }
              })}
              className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
            >
              Applications
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (vacanciesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-500/5 to-blue-600/5">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Vacancy Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage your active job postings, track applications in real-time, and discover top talent for your team.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/organization/post-vacancy" })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 sm:px-6 w-full sm:w-auto shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Post New Vacancy
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 text-gray-900 dark:text-white">
                All Jobs ({vacancies.length})
              </TabsTrigger>
              <TabsTrigger value="open" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-green-600 text-gray-900 dark:text-white">
                Open ({openVacancies.length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800 text-gray-900 dark:text-white">
                Closed ({closedVacancies.length})
              </TabsTrigger>
            </TabsList>

            {/* Search/Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <input
                  type="text"
                  placeholder="Filter by job title or location..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-80"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <TabsContent value="open">
            {openVacancies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No open vacancies
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {openVacancies.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id.toString()}
                    vacancy={vacancy}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedVacancies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No closed vacancies
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {closedVacancies.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id.toString()}
                    vacancy={vacancy}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {vacancies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No vacancies yet
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {vacancies.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id.toString()}
                    vacancy={vacancy}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
