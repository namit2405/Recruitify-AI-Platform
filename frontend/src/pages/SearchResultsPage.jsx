import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";
import { useGlobalSearch } from "../hooks/useQueries";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Briefcase,
  MapPin,
  DollarSign,
  Building2,
  User,
  Search,
} from "lucide-react";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Search');
  
  const searchParams = useSearch({ from: "/search" });
  const query = searchParams?.q || "";

  const { data: searchResults, isLoading } = useGlobalSearch(query);

  const totalResults = searchResults?.total_results || 0;
  const vacancies = searchResults?.vacancies || [];
  const candidates = searchResults?.candidates || [];
  const organizations = searchResults?.organizations || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 to-green-600/5">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/5 to-green-600/5">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            {query ? (
              <>
                Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "
                <span className="font-semibold">{query}</span>"
              </>
            ) : (
              "Enter a search query to find jobs, candidates, or organizations"
            )}
          </p>
        </div>

        {!query ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No search query</h3>
              <p className="text-muted-foreground">
                Use the search bar above to find jobs, candidates, or
                organizations
              </p>
            </CardContent>
          </Card>
        ) : totalResults === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all available jobs
              </p>
              <Button
                onClick={() => navigate({ to: "/candidate/jobs" })}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Browse All Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                All ({totalResults})
              </TabsTrigger>
              <TabsTrigger value="jobs">
                Jobs ({vacancies.length})
              </TabsTrigger>
              <TabsTrigger value="candidates">
                Candidates ({candidates.length})
              </TabsTrigger>
              <TabsTrigger value="organizations">
                Organizations ({organizations.length})
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all" className="space-y-6 mt-6">
              {vacancies.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Jobs</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {vacancies.map((vacancy) => (
                      <VacancyCard key={vacancy.id} vacancy={vacancy} />
                    ))}
                  </div>
                </div>
              )}

              {candidates.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Candidates</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {candidates.map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                </div>
              )}

              {organizations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Organizations</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {organizations.map((org) => (
                      <OrganizationCard key={org.id} organization={org} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Jobs Only */}
            <TabsContent value="jobs" className="mt-6">
              {vacancies.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No jobs found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {vacancies.map((vacancy) => (
                    <VacancyCard key={vacancy.id} vacancy={vacancy} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Candidates Only */}
            <TabsContent value="candidates" className="mt-6">
              {candidates.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No candidates found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {candidates.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Organizations Only */}
            <TabsContent value="organizations" className="mt-6">
              {organizations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No organizations found
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <OrganizationCard key={org.id} organization={org} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
}

// Vacancy Card Component
function VacancyCard({ vacancy }) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{vacancy.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {vacancy.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {vacancy.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {vacancy.location}
              </span>
            )}

            {vacancy.salary_range && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {vacancy.salary_range}
              </span>
            )}

            {vacancy.experience_level && (
              <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">{vacancy.experience_level}</Badge>
            )}
          </div>

          {vacancy.required_skills && vacancy.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vacancy.required_skills.slice(0, 5).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {vacancy.required_skills.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{vacancy.required_skills.length - 5} more
                </Badge>
              )}
            </div>
          )}

          <Button
            onClick={() => navigate({ to: "/candidate/jobs" })}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Candidate Card Component
function CandidateCard({ candidate }) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          {candidate.name}
        </CardTitle>
        <CardDescription>{candidate.email}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {candidate.availability && (
            <p className="text-sm text-muted-foreground">
              Availability: {candidate.availability}
            </p>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 5).map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{candidate.skills.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={() =>
              navigate({ to: `/public/candidate/${candidate.slug}` })
            }
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            size="sm"
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Organization Card Component
function OrganizationCard({ organization }) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {organization.name}
        </CardTitle>
        {organization.location && (
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {organization.location}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {organization.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {organization.description}
            </p>
          )}

          {organization.website && (
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline"
            >
              Visit Website
            </a>
          )}

          <Button
            onClick={() =>
              navigate({ to: `/public/organization/${organization.slug}` })
            }
            variant="outline"
            className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            size="sm"
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
