import { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { fetchApi } from '@/lib/api';
import { toast } from 'sonner';

export function useAgoraRTC() {
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const clientRef = useRef(null);
  const channelRef = useRef(null);

  // Initialize client
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Handle user published (remote user starts sending audio/video)
    client.on('user-published', async (user, mediaType) => {
      console.log('[Agora] User published:', user.uid, mediaType);
      await client.subscribe(user, mediaType);
      
      setRemoteUsers(prev => ({
        ...prev,
        [user.uid]: {
          ...prev[user.uid],
          [mediaType]: user[`${mediaType}Track`]
        }
      }));
    });

    // Handle user unpublished
    client.on('user-unpublished', (user, mediaType) => {
      console.log('[Agora] User unpublished:', user.uid, mediaType);
      setRemoteUsers(prev => {
        const updated = { ...prev };
        if (updated[user.uid]) {
          delete updated[user.uid][mediaType];
          if (!updated[user.uid].audio && !updated[user.uid].video) {
            delete updated[user.uid];
          }
        }
        return updated;
      });
    });

    // Handle user left
    client.on('user-left', (user) => {
      console.log('[Agora] User left:', user.uid);
      setRemoteUsers(prev => {
        const updated = { ...prev };
        delete updated[user.uid];
        return updated;
      });
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  const joinChannel = async (channelName, callType = 'voice') => {
    try {
      setIsConnecting(true);
      console.log('[Agora] Joining channel:', channelName);

      // Get token from backend
      const response = await fetchApi('/chat/agora-token/', {
        method: 'POST',
        body: JSON.stringify({ channel_name: channelName })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const { token, app_id, uid } = response;

      if (!app_id) {
        throw new Error('Agora App ID not configured on server');
      }
      channelRef.current = channelName;

      // Join channel
      await clientRef.current.join(app_id, channelName, token, uid);
      console.log('[Agora] Joined channel successfully');

      // Create local tracks
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true, // Acoustic Echo Cancellation
        AGC: true, // Auto Gain Control
        ANS: true  // Automatic Noise Suppression
      });

      let videoTrack = null;
      if (callType === 'video') {
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '480p_1',
          optimizationMode: 'detail'
        });
      }

      setLocalTracks({ audio: audioTrack, video: videoTrack });

      // Publish tracks
      const tracksToPublish = videoTrack ? [audioTrack, videoTrack] : [audioTrack];
      await clientRef.current.publish(tracksToPublish);
      console.log('[Agora] Published local tracks');

      setIsJoined(true);
      setIsConnecting(false);
      toast.success('Connected to call');
    } catch (error) {
      console.error('[Agora] Error joining channel:', error);
      setIsConnecting(false);
      toast.error('Failed to join call: ' + error.message);
      throw error;
    }
  };

  const leaveChannel = async () => {
    try {
      console.log('[Agora] Leaving channel');

      // Stop and close local tracks
      if (localTracks.audio) {
        localTracks.audio.stop();
        localTracks.audio.close();
      }
      if (localTracks.video) {
        localTracks.video.stop();
        localTracks.video.close();
      }

      setLocalTracks({ audio: null, video: null });
      setRemoteUsers({});

      // Leave channel
      if (clientRef.current && isJoined) {
        await clientRef.current.leave();
      }

      setIsJoined(false);
      channelRef.current = null;
      console.log('[Agora] Left channel successfully');
    } catch (error) {
      console.error('[Agora] Error leaving channel:', error);
    }
  };

  const toggleAudio = () => {
    if (localTracks.audio) {
      const enabled = localTracks.audio.enabled;
      localTracks.audio.setEnabled(!enabled);
      return !enabled;
    }
    return false;
  };

  const toggleVideo = () => {
    if (localTracks.video) {
      const enabled = localTracks.video.enabled;
      localTracks.video.setEnabled(!enabled);
      return !enabled;
    }
    return false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveChannel();
    };
  }, []);

  return {
    localTracks,
    remoteUsers,
    isJoined,
    isConnecting,
    joinChannel,
    leaveChannel,
    toggleAudio,
    toggleVideo
  };
}
