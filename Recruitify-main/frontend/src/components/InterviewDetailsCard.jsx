import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Users, 
  ExternalLink,
  Edit,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export default function InterviewDetailsCard({ 
  application, 
  onEdit, 
  onCancel,
  showActions = true 
}) {
  const {
    interview_type,
    interview_datetime,
    interview_location,
    interview_meet_link,
    interview_panel,
    interview_notes,
    status
  } = application;

  // Don't show if no interview scheduled
  if (!interview_datetime) {
    return null;
  }

  const interviewDate = new Date(interview_datetime);
  const isUpcoming = interviewDate > new Date();
  const isCompleted = status === 'interview_completed';

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg text-gray-900 dark:text-white">Interview Details</CardTitle>
          </div>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
              Completed
            </Badge>
          )}
          {isUpcoming && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
              Upcoming
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(interviewDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(interviewDate, 'h:mm a')}
            </p>
          </div>
        </div>

        {/* Location or Meet Link */}
        {interview_type === 'online' && interview_meet_link ? (
          <div className="flex items-start gap-3">
            <Video className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white mb-2">
                Online Interview
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
                onClick={() => window.open(interview_meet_link, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Join Google Meet
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>
          </div>
        ) : interview_type === 'physical' && interview_location ? (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Physical Interview
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {interview_location}
              </p>
            </div>
          </div>
        ) : null}

        {/* Interview Panel */}
        {interview_panel && interview_panel.length > 0 && (
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Interview Panel
              </p>
              <div className="space-y-1">
                {interview_panel.map((email, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {email}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {interview_notes && (
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {interview_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && !isCompleted && (
          <div className="flex gap-2 pt-3 border-t border-blue-200 dark:border-blue-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
