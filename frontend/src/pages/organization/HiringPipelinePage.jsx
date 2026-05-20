import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import {
  useGetCallerUserProfile,
  useGetVacanciesByOrganization,
  useHiringPipeline,
  useUpdateApplicationStatus,
} from "../../hooks/useQueries";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Star, ArrowRight, Users, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "applied",             label: "Applied",             color: "border-gray-400 dark:border-gray-600",       badge: "bg-gray-500",        text: "text-gray-600 dark:text-gray-400",       bg: "bg-gray-50 dark:bg-gray-800/40" },
  { key: "reviewing",           label: "Reviewing",           color: "border-yellow-400 dark:border-yellow-600",   badge: "bg-yellow-500",      text: "text-yellow-600 dark:text-yellow-400",   bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "shortlisted",         label: "Shortlisted",         color: "border-blue-400 dark:border-blue-600",       badge: "bg-blue-500",        text: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "interview_scheduled", label: "Interview Scheduled", color: "border-purple-400 dark:border-purple-600",   badge: "bg-purple-500",      text: "text-purple-600 dark:text-purple-400",   bg: "bg-purple-50 dark:bg-purple-900/20" },
  { key: "interview_completed", label: "Interview Completed", color: "border-indigo-400 dark:border-indigo-600",   badge: "bg-indigo-500",      text: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { key: "hired",               label: "Hired",               color: "border-green-400 dark:border-green-600",     badge: "bg-green-500",       text: "text-green-600 dark:text-green-400",     bg: "bg-green-50 dark:bg-green-900/20" },
  { key: "rejected",            label: "Rejected",            color: "border-red-400 dark:border-red-600",         badge: "bg-red-500",         text: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20" },
];

const NEXT_STATUS = {
  applied: "reviewing",
  reviewing: "shortlisted",
  shortlisted: "interview_scheduled",
  interview_scheduled: "interview_completed",
  interview_completed: "hired",
};

// Funnel stages (linear flow, excluding rejected)
const FUNNEL = ["applied", "reviewing", "shortlisted", "interview_scheduled", "interview_completed", "hired"];

export default function HiringPipelinePage() {
  const navigate = useNavigate();
  usePageTitle("Hiring Pipeline");

  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const orgId = userProfile?.userType === "organization" ? userProfile.entityId : null;
  const { data: vacancies = [], isLoading: vacanciesLoading } = useGetVacanciesByOrganization(orgId);

  const [selectedVacancySlug, setSelectedVacancySlug] = useState(null);
  const { data: pipeline = {}, isLoading: pipelineLoading, refetch } = useHiringPipeline(selectedVacancySlug);
  const updateStatus = useUpdateApplicationStatus();

  useEffect(() => {
    if (!profileLoading && userProfile?.userType !== "organization") navigate({ to: "/" });
  }, [userProfile, profileLoading, navigate]);

  useEffect(() => {
    if (vacancies.length > 0 && !selectedVacancySlug) setSelectedVacancySlug(vacancies[0].slug);
  }, [vacancies]);

  const handleMove = async (appSlug, newStatus) => {
    try {
      await updateStatus.mutateAsync({ slug: appSlug, status: newStatus });
      refetch();
      toast.success(`Moved to ${newStatus.replace(/_/g, " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalCandidates = STAGES.reduce((sum, s) => sum + (pipeline[s.key]?.length || 0), 0);

  if (vacanciesLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hiring Pipeline</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalCandidates} total candidates across all stages</p>
          </div>
          <div className="sm:ml-auto">
            <Select
              value={selectedVacancySlug || ''}
              onValueChange={(v) => setSelectedVacancySlug(v)}
            >
              <SelectTrigger className="w-full sm:w-72 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select vacancy" />
              </SelectTrigger>
              <SelectContent>
                {vacancies.map((v) => (
                  <SelectItem key={v.id} value={v.id.toString()}>{v.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {pipelineLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <>
            {/* Funnel progress bar */}
            <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recruitment Funnel</p>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {FUNNEL.map((key, idx) => {
                  const stage = STAGES.find(s => s.key === key);
                  const count = pipeline[key]?.length || 0;
                  const isLast = idx === FUNNEL.length - 1;
                  return (
                    <div key={key} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${stage.bg} border ${stage.color} min-w-[80px]`}>
                        <span className={`text-xl font-bold ${stage.text}`}>{count}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight mt-0.5">{stage.label}</span>
                      </div>
                      {!isLast && <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                    </div>
                  );
                })}
                {/* Rejected separate */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                  <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${STAGES[6].bg} border ${STAGES[6].color} min-w-[80px]`}>
                    <span className={`text-xl font-bold ${STAGES[6].text}`}>{pipeline["rejected"]?.length || 0}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight mt-0.5">Rejected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {STAGES.map((stage) => {
                const cards = pipeline[stage.key] || [];
                return (
                  <Card key={stage.key} className={`border-l-4 ${stage.color} border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`}>
                    <CardHeader className="pb-3 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`text-sm font-semibold ${stage.text}`}>{stage.label}</CardTitle>
                        <span className={`text-xs text-white px-2 py-0.5 rounded-full ${stage.badge}`}>{cards.length}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {cards.length === 0 ? (
                        <div className="flex items-center gap-2 py-4 text-gray-400 dark:text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">No candidates</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cards.map((card) => (
                            <div
                              key={card.id}
                              className="group flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                              onClick={() => navigate({ to: `/organization/applications/${card.slug}` })}
                            >
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {card.candidate_name?.charAt(0) || '?'}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{card.candidate_name}</p>
                                {card.interview_datetime && (
                                  <p className="text-xs text-purple-500 dark:text-purple-400">
                                    📅 {new Date(card.interview_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                )}
                              </div>

                              {/* Score */}
                              {card.final_score > 0 && (
                                <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                                  <Star className="h-3 w-3 fill-current" />
                                  {card.final_score?.toFixed(0)}
                                </span>
                              )}

                              {/* Move button */}
                              {NEXT_STATUS[stage.key] && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMove(card.slug, NEXT_STATUS[stage.key]); }}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-all"
                                  title={`Move to ${NEXT_STATUS[stage.key].replace(/_/g, " ")}`}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
