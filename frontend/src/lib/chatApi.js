import { fetchApi } from './api';

/**
 * Chat API functions
 */

// Get all conversations for the current user
export const getConversations = async () => {
  return fetchApi('/chat/conversations/');
};

// Get or create a conversation with a specific user
export const getOrCreateConversation = async (userId) => {
  return fetchApi(`/chat/conversations/${userId}/`, {
    method: 'POST',
  });
};

// Get conversation details
export const getConversation = async (userId) => {
  return fetchApi(`/chat/conversations/${userId}/`);
};

// Get messages for a conversation
export const getMessages = async (conversationId, page = 1) => {
  return fetchApi(`/chat/conversations/${conversationId}/messages/?page=${page}`);
};

// Send a message
export const sendMessage = async (conversationId, content, replyToId = null) => {
  return fetchApi(`/chat/conversations/${conversationId}/messages/`, {
    method: 'POST',
    body: JSON.stringify({ content, reply_to: replyToId }),
  });
};

// Delete a message
export const deleteMessage = async (messageId) => {
  return fetchApi(`/chat/messages/${messageId}/delete/`, {
    method: 'DELETE',
  });
};

// Mark messages as read
export const markMessagesRead = async (conversationId) => {
  return fetchApi(`/chat/conversations/${conversationId}/mark-read/`, {
    method: 'POST',
  });
};

// Get unread message count
export const getUnreadCount = async () => {
  return fetchApi('/chat/unread-count/');
};

// Get user online status
export const getUserStatus = async (userId) => {
  return fetchApi(`/chat/status/${userId}/`);
};

// Send a file message
export const sendFileMessage = async (conversationId, file, caption = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) {
    formData.append('caption', caption);
  }

  const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://tag-committee-appliance-obtain.trycloudflare.com';
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/send-file/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send file');
  }

  return response.json();
};
