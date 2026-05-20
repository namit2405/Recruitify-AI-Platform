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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase, Building2, MapPin, Calendar, CheckCircle,
  XCircle, Clock, Send, Eye, IndianRupee, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",  icon: Clock },
  accepted:  { label: "Accepted",  color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",    icon: CheckCircle },
  rejected:  { label: "Declined",  color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",            icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",           icon: XCircle },
};

export default function JobOffersPage() {
  usePageTitle("Job Offers");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["job-offers"],
    queryFn: () => fetchApi("/job-offers/"),
  });

  const respond = useMutation({
    mutationFn: ({ slug, status }) =>
      fetchApi(`/job-offers/${slug}/`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(status === "accepted" ? "Offer accepted! 🎉" : "Offer declined.");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to respond to offer."),
  });

  const filtered = offers.filter(o =>
    filter === "all" ? true : o.status === filter
  );

  const counts = {
    all: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  const openDetail = (offer) => { setSelectedOffer(offer); setDialogOpen(true); };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Job Offers</h1>
          <p className="text-gray-500 dark:text-gray-400">Offers sent to you by organizations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { key: "all",      label: "Total",    color: "text-blue-600 dark:text-blue-400" },
            { key: "pending",  label: "Pending",  color: "text-yellow-600 dark:text-yellow-400" },
            { key: "accepted", label: "Accepted", color: "text-green-600 dark:text-green-400" },
            { key: "rejected", label: "Declined", color: "text-red-600 dark:text-red-400" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`bg-white dark:bg-gray-900 rounded-xl p-4 border text-left transition-all ${
                filter === key
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              <div className={`text-2xl font-bold ${color}`}>{counts[key]}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            </button>
          ))}
        </div>

        {/* Offer list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No offers yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              When organizations send you offers, they'll appear here.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => navigate({ to: "/browse-jobs" })}
            >
              Browse Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(offer => {
              const cfg = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isPending = offer.status === "pending";
              return (
                <Card
                  key={offer.id}
                  className={`border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-md ${
                    isPending ? "border-l-4 border-l-yellow-400" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Org avatar */}
                      <Avatar className="h-12 w-12 flex-shrink-0 bg-blue-100 dark:bg-blue-900">
                        <AvatarFallback className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                          {offer.organization_name?.charAt(0) || "O"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                              {offer.vacancy_title}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                              <Building2 className="h-3.5 w-3.5" />
                              <span>{offer.organization_name}</span>
                            </div>
                          </div>
                          <Badge className={`${cfg.color} border-0 flex items-center gap-1 flex-shrink-0`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                          </span>
                          {offer.responded_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Responded {formatDistanceToNow(new Date(offer.responded_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Message preview */}
                        {offer.message && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 italic">
                            "{offer.message}"
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(offer)}
                            className="text-xs text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/public/organization/${offer.organization_slug}` })}
                            className="text-xs text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          >
                            <Building2 className="mr-1 h-3 w-3" />
                            View Company
                          </Button>
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => respond.mutate({ slug: offer.slug, status: "accepted" })}
                                disabled={respond.isPending}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respond.mutate({ slug: offer.slug, status: "rejected" })}
                                disabled={respond.isPending}
                                className="text-xs text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Job Offer Details</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                From {selectedOffer.organization_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status banner */}
              {(() => {
                const cfg = STATUS_CONFIG[selectedOffer.status];
                const Icon = cfg.icon;
                return (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{cfg.label}</span>
                    {selectedOffer.responded_at && (
                      <span className="text-xs ml-auto opacity-70">
                        {formatDistanceToNow(new Date(selectedOffer.responded_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Position */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedOffer.vacancy_title}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedOffer.organization_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Sent {formatDistanceToNow(new Date(selectedOffer.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Message */}
              {selectedOffer.message && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Message from {selectedOffer.organization_name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 leading-relaxed">
                    {selectedOffer.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedOffer.status === "pending" ? (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => respond.mutate({ slug: selectedOffer.slug, status: "accepted" })}
                      disabled={respond.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Accept Offer
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                      onClick={() => respond.mutate({ slug: selectedOffer.slug, status: "rejected" })}
                      disabled={respond.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ to: `/public/organization/${selectedOffer.organization_slug}` })}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    View Company Profile
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
}
