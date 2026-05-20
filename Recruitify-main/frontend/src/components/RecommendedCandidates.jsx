import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Send, CheckCircle, Mail, Loader2 } from "lucide-react";
import { useGetRecommendedCandidates, useSendJobOffer } from "../hooks/useQueries";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export default function RecommendedCandidates({ vacancySlug }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetRecommendedCandidates(vacancySlug);
  const sendOffer = useSendJobOffer();
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [offerMessage, setOfferMessage] = useState("");

  const handleSendOffer = async () => {
    if (!selectedCandidate) return;
    try {
      await sendOffer.mutateAsync({
        vacancy_slug: vacancySlug,
        candidate_id: selectedCandidate.candidate_id,
        message: offerMessage,
      });
      toast.success(`Offer sent to ${selectedCandidate.candidate_name}`);
      setOfferDialogOpen(false);
      setSelectedCandidate(null);
      setOfferMessage("");
    } catch (error) {
      toast.error(error?.detail || "Failed to send offer");
    }
  };

  const openOfferDialog = (candidate) => {
    setSelectedCandidate(candidate);
    setOfferMessage(`We are impressed with your profile and would like to offer you the position of ${data?.vacancy_title}. Please review the job details and let us know if you're interested.`);
    setOfferDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = data?.recommendations || [];

  if (recommendations.length === 0) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-gray-900 dark:text-white">Recommended Candidates</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            No matching candidates found at this time
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <CardTitle className="text-gray-900 dark:text-white">Recommended Candidates</CardTitle>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Top {recommendations.length} candidates matching this position
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="space-y-4">
            {recommendations.map((candidate) => (
              <div
                key={candidate.candidate_id}
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={candidate.profile_picture_url} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {candidate.candidate_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {candidate.candidate_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {candidate.candidate_email}
                      </p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 whitespace-nowrap text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                      {candidate.match_score}% Match
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {candidate.skills?.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills?.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                        +{candidate.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {candidate.match_reasons?.map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: `/public/candidate/${candidate.candidate_slug}` })}
                      className="text-xs text-gray-900 dark:text-white"
                    >
                      View Profile
                    </Button>
                    
                    {candidate.has_applied ? (
                      <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                        Already Applied
                      </Badge>
                    ) : candidate.has_offer ? (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                        <Mail className="h-3 w-3" />
                        Offer Sent
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openOfferDialog(candidate)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Send Offer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Offer Dialog */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Send Job Offer</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Send a job offer to {selectedCandidate?.candidate_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-900 dark:text-white">Message (Optional)</Label>
              <Textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={4}
                className="bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOfferDialogOpen(false)}
                className="border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendOffer}
                disabled={sendOffer.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sendOffer.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Offer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
