import { useState, useEffect, useRef } from 'react';
import { useGetConversations, useGetMessages, useGetUnreadCount } from '../hooks/useChatQueries';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Send, Wifi, WifiOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ChatTestPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const { data: conversations, isLoading: conversationsLoading } = useGetConversations();
  const { data: messagesData, isLoading: messagesLoading } = useGetMessages(selectedConversation?.id);
  const { data: unreadData } = useGetUnreadCount();
  
  // WebSocket connection
  const { 
    isConnected, 
    sendMessage: sendWsMessage, 
    sendTypingIndicator,
    markMessagesRead: markWsMessagesRead 
  } = useChatWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation?.id && isConnected) {
      markWsMessagesRead(selectedConversation.id);
    }
  }, [selectedConversation?.id, isConnected, markWsMessagesRead]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Send via WebSocket if connected, otherwise fall back to REST API
    if (isConnected) {
      sendWsMessage(selectedConversation.id, content);
    } else {
      console.log('WebSocket not connected, message not sent');
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (selectedConversation && isConnected) {
      sendTypingIndicator(selectedConversation.id, e.target.value.length > 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Chat Test Page
              {isConnected ? (
                <Badge variant="default" className="bg-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </h1>
            {unreadData && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {unreadData.unread_count} Unread
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="md:col-span-1 overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold truncate">
                            {conv.other_participant?.name || conv.other_participant?.email}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message?.content || 'No messages yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conv.last_message?.created_at
                            ? new Date(conv.last_message.created_at).toLocaleString()
                            : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No conversations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="md:col-span-2 overflow-hidden flex flex-col">
              <CardHeader>
                <CardTitle>
                  {selectedConversation
                    ? `Chat with ${selectedConversation.other_participant?.name || selectedConversation.other_participant?.email}`
                    : 'Select a conversation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {selectedConversation ? (
                  <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : messagesData?.results && messagesData.results.length > 0 ? (
                        <>
                          {messagesData.results.reverse().map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.sender.id === selectedConversation.other_participant.user_id
                                  ? 'justify-start'
                                  : 'justify-end'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  message.sender.id === selectedConversation.other_participant.user_id
                                    ? 'bg-muted'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    message.sender.id === selectedConversation.other_participant.user_id
                                      ? 'text-muted-foreground'
                                      : 'text-blue-100'
                                  }`}
                                >
                                  {new Date(message.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={messageInput}
                          onChange={handleTyping}
                          placeholder="Type a message..."
                          disabled={!isConnected}
                        />
                        <Button
                          type="submit"
                          disabled={!messageInput.trim() || !isConnected}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {!isConnected && (
                        <p className="text-xs text-red-500 mt-2">
                          WebSocket disconnected. Reconnecting...
                        </p>
                      )}
                    </form>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Select a conversation to start chatting</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Debug Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>WebSocket Status: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{isConnected ? 'Connected' : 'Disconnected'}</span></p>
                <p>Total Conversations: {conversations?.length || 0}</p>
                <p>Total Unread: {unreadData?.unread_count || 0}</p>
                <p>Selected Conversation ID: {selectedConversation?.id || 'None'}</p>
                <p>Messages Count: {messagesData?.results?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
