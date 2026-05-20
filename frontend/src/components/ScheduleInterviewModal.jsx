import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Video, Users, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduleInterviewModal({ 
  open, 
  onOpenChange, 
  application,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [interviewType, setInterviewType] = useState('online');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [location, setLocation] = useState('');
  const [panelEmails, setPanelEmails] = useState(['']);
  const [notes, setNotes] = useState('');
  const [createMeetLink, setCreateMeetLink] = useState(true);

  const handleAddPanelMember = () => {
    setPanelEmails([...panelEmails, '']);
  };

  const handleRemovePanelMember = (index) => {
    setPanelEmails(panelEmails.filter((_, i) => i !== index));
  };

  const handlePanelEmailChange = (index, value) => {
    const newEmails = [...panelEmails];
    newEmails[index] = value;
    setPanelEmails(newEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const datetime = `${interviewDate}T${interviewTime}:00Z`;

      // Filter out empty emails
      const validEmails = panelEmails.filter(email => email.trim() !== '');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/applications/${application.slug}/schedule-interview/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            interview_type: interviewType,
            interview_datetime: datetime,
            interview_location: interviewType === 'physical' ? location : '',
            interview_panel: validEmails,
            interview_notes: notes,
            create_meet_link: interviewType === 'online' && createMeetLink,
            send_calendar_invite: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule interview');
      }

      toast.success('Interview scheduled successfully!');
      
      if (data.meet_link) {
        toast.info('Google Meet link created and sent to attendees');
      }

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setInterviewType('online');
      setInterviewDate('');
      setInterviewTime('');
      setLocation('');
      setPanelEmails(['']);
      setNotes('');
      setCreateMeetLink(true);

    } catch (error) {
      console.error('Schedule interview error:', error);
      toast.error(error.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for {application?.candidate_name || 'candidate'} - {application?.vacancy_title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Interview Type */}
          <div className="space-y-2">
            <Label htmlFor="interview-type">Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger id="interview-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Online Interview (Google Meet)
                  </div>
                </SelectItem>
                <SelectItem value="physical">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Physical Interview (Office)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview-date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="interview-date"
                  type="date"
                  min={today}
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-100 [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview-time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  id="interview-time"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="pl-10 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-100 [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location (for physical interviews) */}
          {interviewType === 'physical' && (
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="Office address"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          {/* Auto-create Meet link (for online interviews) */}
          {interviewType === 'online' && (
            <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Checkbox
                id="create-meet"
                checked={createMeetLink}
                onCheckedChange={setCreateMeetLink}
              />
              <Label
                htmlFor="create-meet"
                className="text-sm font-normal cursor-pointer"
              >
                Auto-create Google Meet link and send calendar invites
              </Label>
            </div>
          )}

          {/* Interview Panel */}
          <div className="space-y-2">
            <Label>Interview Panel</Label>
            <p className="text-sm text-gray-500">Add interviewer email addresses</p>
            
            <div className="space-y-2">
              {panelEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="interviewer@company.com"
                      value={email}
                      onChange={(e) => handlePanelEmailChange(index, e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {panelEmails.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemovePanelMember(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPanelMember}
              className="w-full"
            >
              + Add Another Interviewer
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Interview Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Technical round, focus on React and Node.js..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
