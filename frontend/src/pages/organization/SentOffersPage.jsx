import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { usePageTitle } from "../../hooks/usePageTitle";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Briefcase, Users, Calendar, CheckCircle, XCircle,
  Clock, Send, Eye, Search, Inbox, Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",  icon: Clock },
  accepted:  { label: "Accepted",  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",    icon: CheckCircle },
  rejected:  { label: "Declined",  color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",            icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",           icon: XCircle },
};

export default function SentOffersPage() {
  usePageTitle("Sent Offers");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["job-offers"],
    queryFn: () => fetchApi("/job-offers/"),
  });

  const withdraw = useMutation({
    mutationFn: (slug) =>
      fetchApi(`/job-offers/${slug}/`, { method: "PATCH", body: JSON.stringify({ status: "withdrawn" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      queryClient.invalidateQueries({ queryKey: ["recommended-candidates"] });
      toast.success("Offer withdrawn.");
      setWithdrawTarget(null);
    },
    onError: () => toast.error("Failed to withdraw offer."),
  });

  const counts = {
    all:      offers.length,
    pending:  offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  const filtered = offers.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      o.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.vacancy_title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openDetail = (offer) => { setSelectedOffer(offer); setDetailOpen(true); };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Sent Offers</h1>
            <p className="text-gray-500 dark:text-gray-400">Track all job offers you've sent to candidates</p>
          </div>
          <Button onClick={() => navigate({ to: "/organization/vacancies" })} className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
            <Briefcase className="mr-2 h-4 w-4" />
            My Vacancies
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { key: "all",      label: "Total Sent", color: "text-blue-600 dark:text-blue-400" },
            { key: "pending",  label: "Awaiting",   color: "text-yellow-600 dark:text-yellow-400" },
            { key: "accepted", label: "Accepted",   color: "text-green-600 dark:text-green-400" },
            { key: "rejected", label: "Declined",   color: "text-red-600 dark:text-red-400" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`bg-white dark:bg-gray-900 rounded-xl p-4 border text-left transition-all ${
                filter === key
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
              }`}
            >
              <div className={`text-2xl font-bold ${color}`}>{counts[key]}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by candidate or position..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          />
        </div>

        {/* Offer list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {search || filter !== "all" ? "No offers match your filters" : "No offers sent yet"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Send offers to candidates from the Recommended Candidates section on any vacancy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(offer => {
              const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <Card
                  key={offer.id}
                  className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Candidate avatar */}
                      <Avatar className="h-11 w-11 flex-shrink-0 bg-purple-100 dark:bg-purple-900">
                        <AvatarFallback className="text-purple-600 dark:text-purple-400 font-bold">
                          {offer.candidate_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {offer.candidate_name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {offer.candidate_email}
                            </p>
                          </div>
                          <Badge className={`${cfg.color} border-0 flex items-center gap-1 flex-shrink-0`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {offer.vacancy_title}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sent {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                          </span>
                          {offer.responded_at && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Responded {formatDistanceToNow(new Date(offer.responded_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => openDetail(offer)} className="text-xs text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Eye className="mr-1 h-3 w-3" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate({ to: `/public/candidate/${offer.candidate_slug}` })}
                          className="text-xs text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Users className="mr-1 h-3 w-3" />
                          Profile
                        </Button>
                        {offer.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setWithdrawTarget(offer)}
                            className="text-xs text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                          >
                            <Undo2 className="mr-1 h-3 w-3" />
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail dialog */}
      {selectedOffer && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Offer Details</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                Sent to {selectedOffer.candidate_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Status */}
              {(() => {
                const cfg = STATUS_CONFIG[selectedOffer.status];
                const Icon = cfg.icon;
                return (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{cfg.label}</span>
                    {selectedOffer.responded_at && (
                      <span className="text-xs ml-auto opacity-70">
                        Responded {formatDistanceToNow(new Date(selectedOffer.responded_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Candidate */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedOffer.candidate_name}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 pl-6">{selectedOffer.candidate_email}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pl-6">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>For: {selectedOffer.vacancy_title}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-6">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Sent {formatDistanceToNow(new Date(selectedOffer.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Message */}
              {selectedOffer.message && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Your Message
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 leading-relaxed">
                    {selectedOffer.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate({ to: `/public/candidate/${selectedOffer.candidate_slug}` })}
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
                {selectedOffer.status === "pending" && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                    onClick={() => { setDetailOpen(false); setWithdrawTarget(selectedOffer); }}
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Withdraw Offer
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Withdraw confirmation */}
      <AlertDialog open={!!withdrawTarget} onOpenChange={open => !open && setWithdrawTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Withdraw Offer?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              This will withdraw the offer sent to <strong>{withdrawTarget?.candidate_name}</strong> for{" "}
              <strong>{withdrawTarget?.vacancy_title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => withdraw.mutate(withdrawTarget.slug)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
