import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getConversations, 
  getOrCreateConversation,
  getMessages, 
  sendMessage, 
  markMessagesRead,
  getUnreadCount,
  getUserStatus
} from '@/lib/chatApi';
import { getToken } from '@/lib/api';

/**
 * Get all conversations
 */
export function useGetConversations() {
  const token = getToken();
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Get or create conversation with a user
 */
export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => getOrCreateConversation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Get messages for a conversation
 */
export function useGetMessages(conversationId) {
  const token = getToken();
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!token && !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds for now (will be replaced by WebSocket)
  });
}

/**
 * Send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, content }) => sendMessage(conversationId, content),
    onSuccess: (data, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (conversationId) => markMessagesRead(conversationId),
    onSuccess: (data, conversationId) => {
      // Invalidate messages and conversations
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

/**
 * Get unread message count
 */
export function useGetUnreadCount() {
  const token = getToken();
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Get user online status
 */
export function useGetUserStatus(userId) {
  const token = getToken();
  return useQuery({
    queryKey: ['user-status', userId],
    queryFn: () => getUserStatus(userId),
    enabled: !!token && !!userId,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Get accepted conversations (Messages tab)
 */
export function useGetAcceptedConversations() {
  const token = getToken();
  return useQuery({
    queryKey: ['conversations', 'accepted'],
    queryFn: async () => {
      const { fetchApi } = await import('@/lib/api');
      return await fetchApi('/chat/conversations/accepted/');
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
}

/**
 * Get message requests (Requests tab)
 */
export function useGetMessageRequests() {
  const token = getToken();
  return useQuery({
    queryKey: ['conversations', 'requests'],
    queryFn: async () => {
      const { fetchApi } = await import('@/lib/api');
      return await fetchApi('/chat/conversations/requests/');
    },
    enabled: !!token,
    refetchInterval: 30000,
  });
}

/**
 * Accept a message request
 */
export function useAcceptRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId) => {
      const { fetchApi } = await import('@/lib/api');
      return await fetchApi(`/chat/conversations/${conversationId}/accept/`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const { toast } = require('sonner');
      toast.success('Request accepted!');
    },
  });
}

/**
 * Reject a message request
 */
export function useRejectRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId) => {
      const { fetchApi } = await import('@/lib/api');
      return await fetchApi(`/chat/conversations/${conversationId}/reject/`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const { toast } = require('sonner');
      toast.success('Request rejected');
    },
  });
}
