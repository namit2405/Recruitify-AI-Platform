import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetOrCreateConversation } from '../hooks/useChatQueries';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MessageButton({ userId, className = "" }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const createConversation = useGetOrCreateConversation();
  const { user } = useAuth();

  const isSelf = !!user && user.id === userId;

  if (isSelf) return null;

  const handleMessageClick = async () => {
    if (isSelf) {
      toast.error("Cannot create conversation with yourself");
      return;
    }

    setIsCreating(true);
    try {
      const conversation = await createConversation.mutateAsync(userId);
      // Navigate to chat page with this conversation
      navigate({ to: '/chat', search: { conversation: conversation.id } });
    } catch (error) {
      const msg = (error && error.message) || 'Failed to start conversation';
      toast.error(msg);
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleMessageClick}
      disabled={isCreating || isSelf}
      variant="outline"
      className={`border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
      title={isSelf ? 'This is your profile' : undefined}
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          Message
        </>
      )}
    </Button>
  );
}
