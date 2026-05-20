import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  useGetConversations, 
  useGetMessages, 
  useGetUnreadCount,
  useGetAcceptedConversations,
  useGetMessageRequests,
  useAcceptRequest,
  useRejectRequest
} from '../hooks/useChatQueries';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { sendFileMessage, sendMessage, markMessagesRead, deleteMessage } from '../lib/chatApi';
import { fetchApi, fixMediaUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Loader2, Send, Paperclip, X, Download, 
  Reply, Trash2, Phone, Video, MoreVertical, Search, Plus, Check
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ChatPage() {
  usePageTitle('Messages');
  
  const search = useSearch({ from: '/chat' });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'requests'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const pendingCallRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: userProfile } = useGetCallerUserProfile();
  const { data: acceptedConversations, isLoading: acceptedLoading } = useGetAcceptedConversations();
  const { data: messageRequests, isLoading: requestsLoading } = useGetMessageRequests();
  const { data: messagesData, isLoading: messagesLoading } = useGetMessages(selectedConversation?.id);
  const { data: unreadData } = useGetUnreadCount();
  const acceptRequest = useAcceptRequest();
  const rejectRequest = useRejectRequest();
  
  // Use the appropriate conversations based on active tab
  const conversations = activeTab === 'messages' ? acceptedConversations : messageRequests;
  const conversationsLoading = activeTab === 'messages' ? acceptedLoading : requestsLoading;
  
  // Fetch detailed profile of the other participant
  const otherParticipant = selectedConversation?.other_participant;
  const { data: detailedProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['chat-user-profile', otherParticipant?.slug, otherParticipant?.user_type],
    queryFn: async () => {
      if (!otherParticipant?.slug) return null;
      
      try {
        if (otherParticipant.user_type === 'candidate') {
          const response = await fetchApi(`/auth/public/candidate/${otherParticipant.slug}/`);
          return response;
        } else {
          const response = await fetchApi(`/auth/public/organization/${otherParticipant.slug}/`);
          return response;
        }
      } catch (error) {
        console.error('Error fetching detailed profile:', error);
        return null;
      }
    },
    enabled: !!otherParticipant?.slug,
    retry: false,
  });
  
  const { 
    isConnected, 
    sendMessage: sendWsMessage, 
    sendRawMessage,
    sendTypingIndicator,
    markMessagesRead: markWsMessagesRead,
    lastMessage
  } = useChatWebSocket();

  useEffect(() => {
    if (!search?.conversation) return;
    const targetId = parseInt(search.conversation);
    // Check accepted conversations first, then requests
    const allConvs = [...(acceptedConversations || []), ...(messageRequests || [])];
    const conv = allConvs.find(c => c.id === targetId);
    if (conv) {
      setSelectedConversation(conv);
      // Switch to the right tab
      if (messageRequests?.find(c => c.id === targetId)) {
        setActiveTab('requests');
      } else {
        setActiveTab('messages');
      }
    }
  }, [search?.conversation, acceptedConversations, messageRequests]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    
    const markAsRead = async () => {
      try {
        if (isConnected) {
          markWsMessagesRead(selectedConversation.id);
        } else {
          await markMessagesRead(selectedConversation.id);
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };
    
    markAsRead();
  }, [selectedConversation?.id, isConnected, markWsMessagesRead, queryClient]);

  useEffect(() => {
    if (lastMessage?.type === 'typing' && lastMessage.conversation_id === selectedConversation?.id) {
      setIsTyping(lastMessage.is_typing);
      
      if (lastMessage.is_typing) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    }
    
    // Handle incoming WebRTC signals
    if (lastMessage?.type === 'webrtc_signal') {
      const signal = lastMessage.signal;
      
      console.log('[ChatPage] Received WebRTC signal:', signal);
      
      // NOTE: All call handling is now done by GlobalIncomingCallNotification
      // ChatPage no longer handles call signals to avoid conflicts
    }
    
    // Also handle call signals sent as chat messages (for backward compatibility)
    if (lastMessage?.type === 'message' && lastMessage.conversation_id) {
      try {
        const content = lastMessage.content;
        const data = JSON.parse(content);
        
        console.log('[ChatPage] Received message with JSON content:', data);
        
        // NOTE: All call handling is now done by GlobalIncomingCallNotification
        // ChatPage no longer handles call signals to avoid conflicts
      } catch (e) {
        // Not a signal message, ignore
      }
    }
  }, [lastMessage, selectedConversation?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput.trim();
    const replyToId = replyingTo?.id || null;
    setMessageInput('');
    setReplyingTo(null);

    if (isConnected) {
      sendWsMessage(selectedConversation.id, content);
      sendTypingIndicator(selectedConversation.id, false);
    } else {
      try {
        await sendMessage(selectedConversation.id, content, replyToId);
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.error('Error sending message:', error);
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        
        if (!error.message.includes('Internal Server Error')) {
          setMessageInput(content);
          alert(`Failed to send message: ${error.message || 'Unknown error'}`);
        }
      }
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (selectedConversation && isConnected) {
      sendTypingIndicator(selectedConversation.id, e.target.value.length > 0);
    }
  };

  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return new Date(timestamp).toLocaleTimeString();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedConversation) return;

    setIsUploading(true);
    try {
      await sendFileMessage(selectedConversation.id, selectedFile, messageInput);
      
      setSelectedFile(null);
      setFilePreview(null);
      setMessageInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Error sending file:', error);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      if (!error.message.includes('JSON')) {
        alert(error.message || 'Failed to send file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessage(messageId);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const filteredConversations = conversations?.filter(conv => 
    conv.other_participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_participant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Flush pending call signal once WebSocket connects
  useEffect(() => {
    if (isConnected && pendingCallRef.current) {
      const { signal, conversationId, channelName, callType, otherParticipantName } = pendingCallRef.current;
      pendingCallRef.current = null;

      console.log('[ChatPage] WS now connected — flushing pending call signal');
      sendRawMessage({
        type: 'webrtc_signal',
        conversation_id: conversationId,
        signal,
      });

      const startCallEvent = new CustomEvent('startOutgoingCall', {
        detail: { channelName, callType, conversationId, otherParticipantName }
      });
      window.dispatchEvent(startCallEvent);
      toast.success(`Calling ${otherParticipantName}...`);
      setIsCreatingCall(false);
    }
  }, [isConnected, sendRawMessage]);

  const handleStartCall = async (callType) => {
    if (!selectedConversation) return;
    
    console.log('[ChatPage] Starting call, type:', callType);
    setIsCreatingCall(true);
    
    const channelName = `conv_${selectedConversation.id}`;
    const callerName = userProfile?.candidate?.name || 
                       userProfile?.organization?.name ||
                       (userProfile?.user?.first_name && userProfile?.user?.last_name 
                         ? `${userProfile.user.first_name} ${userProfile.user.last_name}` 
                         : userProfile?.user?.first_name || 'Someone');

    const callSignal = {
      type: 'call_initiate',
      conversation_id: selectedConversation.id,
      call_type: callType,
      channel_name: channelName,
      caller_name: callerName,
    };

    if (!isConnected) {
      // WS not ready yet — queue the signal, it will be sent once connected
      console.log('[ChatPage] WS not connected yet — queuing call signal');
      pendingCallRef.current = {
        signal: callSignal,
        conversationId: selectedConversation.id,
        channelName,
        callType,
        otherParticipantName: selectedConversation.other_participant?.name,
      };
      toast.info('Connecting... your call will start shortly.');
      return; // isCreatingCall stays true until the flush effect fires
    }

    try {
      console.log('[ChatPage] Sending call initiation signal');
      sendRawMessage({
        type: 'webrtc_signal',
        conversation_id: selectedConversation.id,
        signal: callSignal,
      });

      const startCallEvent = new CustomEvent('startOutgoingCall', {
        detail: {
          channelName,
          callType,
          conversationId: selectedConversation.id,
          otherParticipantName: selectedConversation.other_participant?.name,
        }
      });
      window.dispatchEvent(startCallEvent);
      toast.success(`Calling ${selectedConversation.other_participant?.name}...`);
    } catch (error) {
      console.error('[ChatPage] Error starting call:', error);
      toast.error(error.message || 'Failed to start call');
    } finally {
      setIsCreatingCall(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-shrink-0">
        <Header />
      </div>
      
      <div className="flex overflow-hidden border-t border-gray-200 dark:border-gray-700" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Sidebar - Hidden on mobile when conversation is selected */}
        <div className={`w-full sm:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 ${
          selectedConversation ? 'hidden sm:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-gray-100 dark:bg-gray-800 border-0 h-9"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <button 
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 ${
                activeTab === 'messages' 
                  ? 'border-black dark:border-white text-gray-900 dark:text-white' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              Messages
              {acceptedConversations && acceptedConversations.length > 0 && (
                <span className="ml-2 text-xs">({acceptedConversations.length})</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 ${
                activeTab === 'requests' 
                  ? 'border-black dark:border-white text-gray-900 dark:text-white' 
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              Requests
              {messageRequests && messageRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {messageRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation?.id === conv.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <div 
                    onClick={() => setSelectedConversation(conv)}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={fixMediaUrl(conv.other_participant?.profile_picture_url)} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{conv.other_participant?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className={`text-sm truncate text-gray-900 dark:text-white ${conv.unread_count > 0 ? 'font-semibold' : ''}`}>
                          {conv.other_participant?.name || conv.other_participant?.email}
                        </p>
                        {conv.last_message?.created_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {formatMessageTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm text-gray-500 dark:text-gray-400 truncate ${conv.unread_count > 0 ? 'font-medium' : ''}`}>
                        {(() => {
                          // Hide call signaling messages from preview
                          const content = conv.last_message?.content || 'Start a conversation';
                          try {
                            const parsed = JSON.parse(content);
                            if (parsed.type && ['call_initiate', 'call_end', 'call_reject'].includes(parsed.type)) {
                              if (parsed.type === 'call_initiate') {
                                return '📞 Started a call';
                              } else if (parsed.type === 'call_end') {
                                return '📞 Call ended';
                              } else {
                                return '📞 Call declined';
                              }
                            }
                          } catch (e) {
                            // Not JSON, return as is
                          }
                          return content;
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Accept/Reject buttons for requests */}
                  {activeTab === 'requests' && conv.is_request && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptRequest.mutate(conv.id);
                        }}
                        disabled={acceptRequest.isPending}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-9"
                      >
                        {acceptRequest.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to reject this request?')) {
                            rejectRequest.mutate(conv.id);
                          }
                        }}
                        disabled={rejectRequest.isPending}
                        variant="outline"
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 h-9"
                      >
                        {rejectRequest.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-20 h-20 rounded-full border-2 border-black dark:border-white flex items-center justify-center mb-3">
                  <Send className="h-10 w-10 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-lg font-light mb-1 text-gray-900 dark:text-white">
                  {activeTab === 'requests' ? 'No message requests' : 'Your messages'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {activeTab === 'requests' 
                    ? 'Message requests from people you don\'t follow will appear here.' 
                    : 'Send private photos and messages to a friend or group.'}
                </p>
                {activeTab === 'messages' && (
                  <Button className="bg-blue-500 hover:bg-blue-600">Send message</Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area - Takes full width when no conversation selected */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${!selectedConversation ? 'items-center justify-center hidden sm:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Back button for mobile */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 sm:hidden flex-shrink-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={fixMediaUrl(selectedConversation.other_participant?.profile_picture_url)} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{selectedConversation.other_participant?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {selectedConversation.other_participant?.name || selectedConversation.other_participant?.email}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{isTyping ? 'typing...' : 'Active now'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(() => {
                      const myType = userProfile?.userType;
                      const theirType = selectedConversation.other_participant?.user_type;
                      // Candidates cannot call organizations; organizations cannot call organizations
                      const canCall = !(myType === 'candidate' && theirType === 'organization')
                                   && !(myType === 'organization' && theirType === 'organization');
                      if (!canCall) return null;
                      return (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 flex-shrink-0"
                            onClick={() => handleStartCall('voice')}
                            disabled={isCreatingCall}
                            title={isConnected ? "Start voice call" : "Connecting..."}
                          >
                            {isCreatingCall ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            ) : (
                              <Phone className={`h-5 w-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 flex-shrink-0"
                            onClick={() => handleStartCall('video')}
                            disabled={isCreatingCall}
                            title={isConnected ? "Start video call" : "Connecting..."}
                          >
                            <Video className={`h-5 w-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : messagesData?.results && messagesData.results.length > 0 ? (
                  <div className="space-y-1">
                    {[...messagesData.results].reverse().map((message, index, arr) => {
                      const currentUserId = userProfile?.user?.id;
                      const isOwnMessage = message.sender.id === currentUserId;
                      const isDeleted = message.is_deleted;
                      const prevMessage = arr[index - 1];
                      const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;

                      // Hide call signaling messages (call_initiate, call_end, call_reject)
                      try {
                        const content = message.content;
                        const parsed = JSON.parse(content);
                        if (parsed.type && ['call_initiate', 'call_end', 'call_reject'].includes(parsed.type)) {
                          return null; // Don't render call signaling messages
                        }
                      } catch (e) {
                        // Not JSON, continue rendering normally
                      }

                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : ''}`}>
                          <div className={`flex gap-2 max-w-[60%] group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            {!isOwnMessage && showAvatar && (
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={fixMediaUrl(message.sender.profile_picture_url)} />
                                <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">{message.sender.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                            )}
                            {!isOwnMessage && !showAvatar && <div className="w-7" />}
                            
                            <div>
                              <div className={`rounded-3xl px-4 py-2 inline-block ${
                                isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                              } ${isDeleted ? 'opacity-60 italic' : ''}`}>
                                {isDeleted ? (
                                  <p className="text-sm">Message deleted</p>
                                ) : (
                                  <>
                                    {message.message_type === 'image' && message.attachment_url && (
                                      <div>
                                        <img
                                          src={fixMediaUrl(message.attachment_url)}
                                          alt={message.attachment_name}
                                          className="rounded-2xl max-w-full h-auto max-h-64 cursor-pointer"
                                          onClick={() => window.open(fixMediaUrl(message.attachment_url), '_blank')}
                                        />
                                        {message.content && <p className="text-sm mt-2">{message.content}</p>}
                                      </div>
                                    )}
                                    {message.message_type === 'file' && message.attachment_url && (
                                      <div>
                                        <a
                                          href={fixMediaUrl(message.attachment_url)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-2 p-3 rounded-2xl ${
                                            isOwnMessage
                                              ? 'bg-blue-700 text-white'
                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                          }`}
                                        >
                                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{message.attachment_name}</p>
                                            {message.attachment_size && (
                                              <p className={`text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {formatFileSize(message.attachment_size)}
                                              </p>
                                            )}
                                          </div>
                                          <Download className="h-4 w-4 flex-shrink-0 opacity-70" />
                                        </a>
                                        {message.content && <p className="text-sm mt-2">{message.content}</p>}
                                      </div>
                                    )}
                                    {message.message_type === 'text' && (
                                      <p className="text-sm">{message.content}</p>
                                    )}
                                  </>
                                )}
                              </div>
                              {!isDeleted && (
                                <div className={`opacity-0 group-hover:opacity-100 flex gap-1 mt-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => handleReply(message)}>
                                    <Reply className="h-3 w-3" />
                                  </Button>
                                  {isOwnMessage && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 dark:hover:text-red-400" onClick={() => handleDeleteMessage(message.id)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full border-2 border-black flex items-center justify-center mx-auto mb-3">
                        <Send className="h-10 w-10" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
                {replyingTo && (
                  <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-white">Replying to {replyingTo.sender.name || replyingTo.sender.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 dark:text-gray-400" onClick={handleCancelReply}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {selectedFile && (
                  <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <Paperclip className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 dark:text-gray-400" onClick={handleRemoveFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={messageInput}
                      onChange={handleTyping}
                      placeholder="Message..."
                      disabled={isUploading}
                      className="bg-gray-100 dark:bg-gray-800 border-0 rounded-full pr-10"
                    />
                    {(messageInput.trim() || selectedFile) && !isUploading && (
                      <Button
                        type={selectedFile ? "button" : "submit"}
                        onClick={selectedFile ? handleSendFile : undefined}
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      >
                        <Send className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                    {isUploading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-2 border-black dark:border-white flex items-center justify-center mx-auto mb-3">
                  <Send className="h-10 w-10 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-lg font-light mb-1 text-gray-900 dark:text-white">Your messages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send private photos and messages to a friend or group.</p>
              </div>
            </div>
          )}
        </div>

        {/* User Details Panel - Right Side - Hidden on mobile */}
        {selectedConversation && (
          <div className="hidden lg:flex w-80 border-l border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-900 overflow-y-auto">
            {/* User Details Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                User Details
              </h3>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={fixMediaUrl(detailedProfile?.profile_picture_url) || fixMediaUrl(selectedConversation.other_participant?.profile_picture_url)} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                      {selectedConversation.other_participant?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900"></div>
                </div>
                
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                  {detailedProfile?.name || selectedConversation.other_participant?.name || 'Unknown User'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {detailedProfile?.email || selectedConversation.other_participant?.email}
                </p>
                
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={() => {
                      if (detailedProfile?.slug || otherParticipant?.slug) {
                        const slug = detailedProfile?.slug || otherParticipant?.slug;
                        const profilePath = selectedConversation.other_participant?.user_type === 'candidate' 
                          ? `/public/candidate/${slug}`
                          : `/public/organization/${slug}`;
                        navigate({ to: profilePath });
                      }
                    }}
                    disabled={!detailedProfile?.slug && !otherParticipant?.slug}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                About
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {detailedProfile?.summary || 
                 detailedProfile?.description || 
                 'No bio available yet.'}
              </p>
            </div>

            {/* Skills Section - For Candidates */}
            {detailedProfile?.skills && detailedProfile.skills.length > 0 && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {detailedProfile.skills.slice(0, 10).map((skill, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Contact Info */}
            {(detailedProfile?.location || detailedProfile?.phone || detailedProfile?.website) && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Contact Information
                </h4>
                <div className="space-y-2 text-sm">
                  {detailedProfile?.location && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{detailedProfile.location}</span>
                    </div>
                  )}
                  {detailedProfile?.phone && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{detailedProfile.phone}</span>
                    </div>
                  )}
                  {detailedProfile?.website && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={detailedProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {detailedProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shared Media Section */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Shared Media
              </h4>
              {(() => {
                const sharedFiles = messagesData?.results?.filter(
                  m => (m.message_type === 'image' || m.message_type === 'file') && !m.is_deleted && m.attachment_url
                ) || [];
                if (sharedFiles.length === 0) {
                  return <p className="text-xs text-gray-400 dark:text-gray-500">No shared files yet</p>;
                }
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {sharedFiles.slice(0, 9).map((message) => (
                      message.message_type === 'image' ? (
                        <div
                          key={message.id}
                          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(fixMediaUrl(message.attachment_url), '_blank')}
                        >
                          <img
                            src={fixMediaUrl(message.attachment_url)}
                            alt={message.attachment_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <a
                          key={message.id}
                          href={fixMediaUrl(message.attachment_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center gap-1 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
                          title={message.attachment_name}
                        >
                          <Paperclip className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-300 text-center truncate w-full leading-tight">
                            {message.attachment_name}
                          </p>
                        </a>
                      )
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="p-6">
              <button className="w-full text-left py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-3 font-medium text-sm transition-colors">
                Block Contact
              </button>
              <button className="w-full text-left py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-3 font-medium text-sm transition-colors">
                Report User
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}
