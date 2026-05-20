import { useState, useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useAgoraRTC } from '../hooks/useAgoraRTC';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Phone, Video, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import VideoCallModal from './VideoCallModal';

/**
 * Global incoming call notification that appears anywhere in the app
 * Listens to WebSocket for incoming calls and shows notification
 */
export default function GlobalIncomingCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isJoiningAsCallerRef, setIsJoiningAsCaller] = useState(false);
  const [lastProcessedSignal, setLastProcessedSignal] = useState(null);
  const router = useRouter();
  
  const { data: userProfile } = useGetCallerUserProfile();
  const { lastMessage, isConnected, sendRawMessage } = useChatWebSocket();
  const {
    localTracks,
    remoteUsers,
    joinChannel,
    leaveChannel,
    toggleAudio,
    toggleVideo
  } = useAgoraRTC();

  // Listen for incoming call signals
  useEffect(() => {
    if (!lastMessage) return;

    // Handle WebRTC signals
    if (lastMessage.type === 'webrtc_signal') {
      const signal = lastMessage.signal;
      const senderId = lastMessage.sender_id;
      const currentUserId = userProfile?.user?.id;
      
      console.log('[GlobalCall] Signal received:', {
        signalType: signal.type,
        senderId,
        currentUserId,
        isSelf: senderId === currentUserId,
        hasActiveCall: !!activeCall,
        hasIncomingCall: !!incomingCall
      });
      
      // Handle call_initiate signal
      if (signal.type === 'call_initiate') {
        // Create a unique key for this signal to prevent duplicates
        const signalKey = `${signal.type}_${signal.conversation_id}_${senderId}`;
        
        // Check if we've already processed this exact signal recently (within 2 seconds)
        if (lastProcessedSignal?.key === signalKey && 
            Date.now() - lastProcessedSignal.timestamp < 2000) {
          console.log('[GlobalCall] Ignoring duplicate call_initiate signal');
          return;
        }
        
        // Mark this signal as processed
        setLastProcessedSignal({ key: signalKey, timestamp: Date.now() });
        
        // If this is from yourself, you're the caller - join the channel
        if (senderId && currentUserId && senderId === currentUserId) {
          console.log('[GlobalCall] This is my own call initiation, joining as caller');
          
          // Only join if not already in a call and not already joining
          if (!activeCall && !isJoiningAsCallerRef) {
            setIsJoiningAsCaller(true);
            
            joinChannel(signal.channel_name, signal.call_type)
              .then(() => {
                setActiveCall({
                  type: signal.call_type,
                  isIncoming: false,
                  callerName: 'Calling...',
                  conversationId: signal.conversation_id
                });
                console.log('[GlobalCall] Joined as caller successfully');
                setIsJoiningAsCaller(false);
              })
              .catch(error => {
                console.error('[GlobalCall] Error joining as caller:', error);
                toast.error('Failed to start call: ' + error.message);
                setIsJoiningAsCaller(false);
              });
          } else {
            console.log('[GlobalCall] Ignoring duplicate call_initiate - already joining or in call');
          }
          return;
        }
        
        // Otherwise, this is an incoming call from someone else
        // Only accept new incoming calls if there's no active call
        if (activeCall) {
          console.log('[GlobalCall] Ignoring incoming call - already in a call');
          return;
        }
        
        console.log('[GlobalCall] Incoming call from:', signal.caller_name);
        setIncomingCall({
          caller_name: signal.caller_name,
          call_type: signal.call_type,
          conversation_id: signal.conversation_id,
          channel_name: signal.channel_name
        });
      } else if (signal.type === 'call_reject' || signal.type === 'call_end') {
        console.log('[GlobalCall] Call ended by remote user');
        handleEndCall(false);
      }
    }
  }, [lastMessage, userProfile, activeCall, incomingCall, joinChannel, isJoiningAsCallerRef, lastProcessedSignal]);

  // Listen for outgoing call events from ChatPage
  useEffect(() => {
    const handleStartOutgoingCall = async (event) => {
      const { channelName, callType, conversationId, otherParticipantName } = event.detail;
      
      console.log('[GlobalCall] Starting outgoing call:', { channelName, callType });
      
      // Only start if not already in a call
      if (activeCall || isJoiningAsCallerRef) {
        console.log('[GlobalCall] Already in a call, ignoring');
        return;
      }
      
      setIsJoiningAsCaller(true);
      
      try {
        await joinChannel(channelName, callType);
        
        setActiveCall({
          type: callType,
          isIncoming: false,
          callerName: otherParticipantName || 'Calling...',
          conversationId: conversationId
        });
        
        console.log('[GlobalCall] Outgoing call started successfully');
        setIsJoiningAsCaller(false);
      } catch (error) {
        console.error('[GlobalCall] Error starting outgoing call:', error);
        toast.error('Failed to start call: ' + error.message);
        setIsJoiningAsCaller(false);
      }
    };
    
    window.addEventListener('startOutgoingCall', handleStartOutgoingCall);
    
    return () => {
      window.removeEventListener('startOutgoingCall', handleStartOutgoingCall);
    };
  }, [activeCall, isJoiningAsCallerRef, joinChannel]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    
    console.log('[GlobalCall] Accepting call');
    
    // Store conversation ID before clearing incomingCall
    const conversationId = incomingCall.conversation_id;
    const channelName = incomingCall.channel_name;
    const callType = incomingCall.call_type;
    const callerName = incomingCall.caller_name;
    
    try {
      // Clear incoming call FIRST to prevent re-rendering issues
      setIncomingCall(null);
      
      // Join Agora channel
      console.log('[GlobalCall] Joining Agora channel:', channelName);
      await joinChannel(channelName, callType);
      
      // Set active call state AFTER successfully joining
      setActiveCall({
        type: callType,
        isIncoming: true,
        callerName: callerName,
        conversationId: conversationId
      });
      
      console.log('[GlobalCall] Call accepted successfully, active call set');
      
      // Navigation is optional - call works without it
      // User can manually navigate to chat if needed
      
    } catch (error) {
      console.error('[GlobalCall] Error accepting call:', error);
      toast.error('Failed to accept call: ' + error.message);
      setIncomingCall(null);
      setActiveCall(null);
    }
  };

  const handleRejectCall = () => {
    console.log('[GlobalCall] Rejecting call');
    if (incomingCall && isConnected) {
      // Send rejection signal
      const rejectSignal = {
        type: 'call_reject',
        conversation_id: incomingCall.conversation_id
      };
      
      sendRawMessage({
        type: 'webrtc_signal',
        conversation_id: incomingCall.conversation_id,
        signal: rejectSignal
      });
    }
    
    setIncomingCall(null);
    toast.info('Call declined');
  };

  const handleEndCall = async (sendSignal = true) => {
    console.log('[GlobalCall] Ending call, sendSignal:', sendSignal, 'activeCall:', activeCall);
    
    // Send call end signal FIRST (before leaving channel)
    if (sendSignal && activeCall && isConnected) {
      try {
        const endSignal = {
          type: 'call_end',
          conversation_id: activeCall.conversationId
        };
        console.log('[GlobalCall] Sending call_end signal to conversation:', activeCall.conversationId);
        sendRawMessage({
          type: 'webrtc_signal',
          conversation_id: activeCall.conversationId,
          signal: endSignal
        });
      } catch (error) {
        console.error('[GlobalCall] Error sending end signal:', error);
      }
    }
    
    // Then leave the channel
    try {
      await leaveChannel();
    } catch (error) {
      console.error('[GlobalCall] Error leaving channel:', error);
    }
    
    // Clear state
    setActiveCall(null);
    setIncomingCall(null);
  };

  // Cleanup on unmount or page reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      console.log('[GlobalCall] Page unloading, ending call');
      if (activeCall) {
        // Send end signal synchronously
        if (isConnected && activeCall.conversationId) {
          const endSignal = {
            type: 'call_end',
            conversation_id: activeCall.conversationId
          };
          
          // Use sendBeacon for reliable delivery during page unload
          const data = JSON.stringify({
            type: 'webrtc_signal',
            conversation_id: activeCall.conversationId,
            signal: endSignal
          });
          
          // Try sendRawMessage first
          try {
            sendRawMessage({
              type: 'webrtc_signal',
              conversation_id: activeCall.conversationId,
              signal: endSignal
            });
          } catch (error) {
            console.error('[GlobalCall] Error in beforeunload:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't automatically end call on component unmount
      // Only end on explicit user action or beforeunload
    };
  }, [activeCall, isConnected, sendRawMessage]);

  // Update caller name when remote user joins
  useEffect(() => {
    if (activeCall && Object.keys(remoteUsers).length > 0 && activeCall.callerName === 'Calling...') {
      // Remote user has joined, call is now connected
      console.log('[GlobalCall] Remote user joined, call is now connected');
    }
  }, [remoteUsers, activeCall]);

  return (
    <>
      {/* Incoming Call Notification */}
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              {/* Call Icon Animation */}
              <div className="mb-6 relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                  {incomingCall.call_type === 'voice' ? (
                    <Phone className="h-12 w-12 text-white" />
                  ) : (
                    <Video className="h-12 w-12 text-white" />
                  )}
                </div>
                <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-blue-500/30 animate-ping"></div>
              </div>

              {/* Caller Info */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {incomingCall.caller_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Incoming {incomingCall.call_type} call...
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleRejectCall}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white h-14 text-lg"
                >
                  <XCircle className="h-6 w-6 mr-2" />
                  Decline
                </Button>
                <Button
                  onClick={handleAcceptCall}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white h-14 text-lg"
                >
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {activeCall && (
        <VideoCallModal
          isOpen={true}
          onClose={() => handleEndCall(true)}
          callType={activeCall.type}
          isIncoming={activeCall.isIncoming}
          callerName={activeCall.callerName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          localTracks={localTracks}
          remoteUsers={remoteUsers}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
        />
      )}
    </>
  );
}
