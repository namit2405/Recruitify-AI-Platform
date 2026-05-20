import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video, Mic, MicOff, VideoOff as VideoOffIcon, PhoneOff } from 'lucide-react';

export default function VideoCallModal({ 
  isOpen, 
  onClose, 
  callType, 
  isIncoming,
  callerName,
  onAccept,
  onReject,
  localTracks,
  remoteUsers,
  onToggleAudio,
  onToggleVideo
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Update isVideoOff based on callType
  useEffect(() => {
    setIsVideoOff(callType === 'voice');
  }, [callType]);

  // Play local video track
  useEffect(() => {
    if (localTracks.video && localVideoRef.current) {
      console.log('[VideoCallModal] Playing local video track');
      try {
        localTracks.video.play(localVideoRef.current);
        console.log('[VideoCallModal] Local video playing successfully');
      } catch (err) {
        console.error('[VideoCallModal] Error playing local video:', err);
      }
    } else {
      console.log('[VideoCallModal] Local video not available:', {
        hasVideoTrack: !!localTracks.video,
        hasVideoRef: !!localVideoRef.current,
        callType,
        isVideoOff
      });
    }
    
    return () => {
      if (localTracks.video && localVideoRef.current) {
        try {
          localTracks.video.stop();
        } catch (err) {
          console.error('[VideoCallModal] Error stopping local video:', err);
        }
      }
    };
  }, [localTracks.video, callType, isVideoOff]);

  // Play remote tracks
  useEffect(() => {
    const remoteUserIds = Object.keys(remoteUsers);
    console.log('[VideoCallModal] Remote users:', remoteUserIds.length);
    
    if (remoteUserIds.length > 0) {
      const firstUser = remoteUsers[remoteUserIds[0]];
      
      // Play video track
      if (firstUser.video && remoteVideoRef.current) {
        console.log('[VideoCallModal] Playing remote video track');
        firstUser.video.play(remoteVideoRef.current);
      }
      
      // Play audio track - CRITICAL for two-way audio
      if (firstUser.audio) {
        console.log('[VideoCallModal] Playing remote audio track');
        
        // Create audio element if it doesn't exist
        if (!remoteAudioRef.current) {
          remoteAudioRef.current = document.createElement('audio');
          remoteAudioRef.current.autoplay = true;
          remoteAudioRef.current.playsInline = true;
          document.body.appendChild(remoteAudioRef.current);
        }
        
        // Play the audio track
        try {
          const playResult = firstUser.audio.play(remoteAudioRef.current);
          if (playResult && typeof playResult.then === 'function') {
            playResult.then(() => {
              console.log('[VideoCallModal] Remote audio playing successfully');
            }).catch(err => {
              console.error('[VideoCallModal] Error playing remote audio:', err);
            });
          } else {
            console.log('[VideoCallModal] Remote audio track attached to element');
          }
        } catch (err) {
          console.error('[VideoCallModal] Error playing remote audio:', err);
        }
      }
    }
    
    // Cleanup audio element when remote user leaves
    return () => {
      if (remoteUserIds.length === 0 && remoteAudioRef.current) {
        console.log('[VideoCallModal] Cleaning up remote audio element');
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, [remoteUsers]);

  const handleToggleAudio = () => {
    const enabled = onToggleAudio();
    setIsMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = onToggleVideo();
    setIsVideoOff(!enabled);
  };

  if (!isOpen) return null;

  const hasRemoteUser = Object.keys(remoteUsers).length > 0;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative bg-gray-900">
        {hasRemoteUser ? (
          <div 
            ref={remoteVideoRef}
            className="w-full h-full"
            style={{ backgroundColor: '#1f2937' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                <span className="text-5xl text-white font-bold">
                  {callerName?.charAt(0) || '?'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{callerName}</h2>
              <p className="text-gray-400">
                {isIncoming ? 'Connecting...' : 'Calling...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && localTracks.video && !isVideoOff && (
          <div className="absolute top-4 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
            <div 
              ref={localVideoRef}
              className="w-full h-full"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        {/* Local Video Placeholder (when camera is off) */}
        {callType === 'video' && isVideoOff && (
          <div className="absolute top-4 right-4 w-32 h-40 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white flex items-center justify-center">
            <VideoOffIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {/* Call Status Indicator */}
        {hasRemoteUser && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Connected</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6">
        {/* Active call controls - always show these since VideoCallModal is only rendered for active calls */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center items-center gap-4">
            {/* Microphone Toggle */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleToggleAudio}
                variant="outline"
                className={`w-14 h-14 rounded-full border-2 transition-all ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                    : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <span className="text-xs text-gray-400">
                {isMuted ? 'Muted' : 'Mic'}
              </span>
            </div>

            {/* Video Toggle (only for video calls) */}
            {callType === 'video' && (
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={handleToggleVideo}
                  variant="outline"
                  className={`w-14 h-14 rounded-full border-2 transition-all ${
                    isVideoOff 
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                      : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                  }`}
                  title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoOff ? <VideoOffIcon className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
                <span className="text-xs text-gray-400">
                  {isVideoOff ? 'Camera Off' : 'Camera'}
                </span>
              </div>
            )}

            {/* End Call */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={onClose}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                title="End call"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <span className="text-xs text-gray-400">End</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
