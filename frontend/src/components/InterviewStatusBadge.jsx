import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, Video, MapPin } from 'lucide-react';

export default function InterviewStatusBadge({ application }) {
  const { status, interview_type, interview_datetime, interview_meet_link } = application;

  // Show interview badge only for interview-related statuses
  if (status !== 'interview_scheduled' && status !== 'interview_completed') {
    return null;
  }

  const isScheduled = status === 'interview_scheduled';
  const isCompleted = status === 'interview_completed';

  return (
    <div className="flex flex-wrap gap-2">
      {isScheduled && (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
          <Calendar className="h-3 w-3 mr-1" />
          Interview Scheduled
        </Badge>
      )}

      {isCompleted && (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Interview Completed
        </Badge>
      )}

      {interview_type === 'online' && interview_meet_link && (
        <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
          <Video className="h-3 w-3 mr-1" />
          Online
        </Badge>
      )}

      {interview_type === 'physical' && (
        <Badge variant="outline" className="border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-400">
          <MapPin className="h-3 w-3 mr-1" />
          Physical
        </Badge>
      )}
    </div>
  );
}
