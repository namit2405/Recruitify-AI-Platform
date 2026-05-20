import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export function useWebRTC(sendSignal) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  
  const peerConnection = useRef(null);
  const pendingCandidates = useRef([]);

  const startCall = useCallback(async (callType) => {
    try {
      setCallStatus('Getting media...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video/audio calls. Please use Chrome, Firefox, or Safari.');
      }
      
      // Mobile-friendly constraints with fallback
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let stream;
      
      // Try with video first if video call
      if (callType === 'video') {
        try {
          // Start with basic constraints for better mobile compatibility
          const videoConstraints = isMobile ? {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              facingMode: 'user',
              width: { max: 640 },
              height: { max: 480 }
            }
          } : {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          };
          
          stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
        } catch (videoError) {
          console.warn('Video failed, trying audio only:', videoError);
          toast.warning('Camera not available, starting audio-only call');
          
          // Fallback to audio only
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }, 
            video: false 
          });
        }
      } else {
        // Audio only call
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: false 
        });
      }
      
      setLocalStream(stream);
      
      // Create peer connection
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setCallStatus('Connected');
      };
      
      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle connection state
      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState;
        setCallStatus(state);
        
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          endCall();
        }
      };
      
      // Create and send offer
      setCallStatus('Creating offer...');
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      sendSignal({
        type: 'offer',
        offer: offer
      });
      
      setCallStatus('Calling...');
      
      return stream;
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Error: ' + error.message);
      throw error;
    }
  }, [sendSignal]);

  const answerCall = useCallback(async (callType, offer) => {
    try {
      console.log('[WebRTC] answerCall called with:', { callType, hasOffer: !!offer });
      setCallStatus('Getting media...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support video/audio calls. Please use Chrome, Firefox, or Safari.');
      }
      
      // Mobile-friendly constraints with fallback
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let stream;
      
      // Try with video first if video call
      if (callType === 'video') {
        try {
          // Start with basic constraints for better mobile compatibility
          const videoConstraints = isMobile ? {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              facingMode: 'user',
              width: { max: 640 },
              height: { max: 480 }
            }
          } : {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          };
          
          stream = await navigator.mediaDevices.getUserMedia(videoConstraints);
          console.log('[WebRTC] Got video stream with tracks:', stream.getTracks().map(t => t.kind));
        } catch (videoError) {
          console.warn('Video failed, trying audio only:', videoError);
          toast.warning('Camera not available, joining with audio only');
          
          // Fallback to audio only
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }, 
            video: false 
          });
          console.log('[WebRTC] Got audio-only stream with tracks:', stream.getTracks().map(t => t.kind));
        }
      } else {
        // Audio only call
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: false 
        });
        console.log('[WebRTC] Got audio stream with tracks:', stream.getTracks().map(t => t.kind));
      }
      
      setLocalStream(stream);
      console.log('[WebRTC] Local stream set');
      
      // Create peer connection
      peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
      console.log('[WebRTC] Peer connection created');
      
      // Add local stream tracks
      stream.getTracks().forEach(track => {
        console.log('[WebRTC] Adding track to peer connection:', track.kind, track.enabled);
        peerConnection.current.addTrack(track, stream);
      });
      
      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        console.log('[WebRTC] Received remote track:', event.track.kind);
        setRemoteStream(event.streams[0]);
        setCallStatus('Connected');
      };
      
      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[WebRTC] Sending ICE candidate');
          sendSignal({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      // Handle connection state
      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current.connectionState;
        console.log('[WebRTC] Connection state changed:', state);
        setCallStatus(state);
        
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          endCall();
        }
      };
      
      // Set remote description (offer)
      console.log('[WebRTC] Setting remote description (offer)');
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set');
      
      // Process any pending ICE candidates
      for (const candidate of pendingCandidates.current) {
        console.log('[WebRTC] Adding pending ICE candidate');
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current = [];
      
      // Create and send answer
      setCallStatus('Answering...');
      console.log('[WebRTC] Creating answer');
      const answer = await peerConnection.current.createAnswer();
      console.log('[WebRTC] Answer created');
      await peerConnection.current.setLocalDescription(answer);
      console.log('[WebRTC] Local description set (answer)');
      
      console.log('[WebRTC] Sending answer via WebSocket');
      sendSignal({
        type: 'answer',
        answer: answer
      });
      
      setCallStatus('Connected');
      console.log('[WebRTC] Answer call complete');
      
      return stream;
    } catch (error) {
      console.error('Error answering call:', error);
      setCallStatus('Error: ' + error.message);
      throw error;
    }
  }, [sendSignal]);

  const handleSignal = useCallback(async (signal) => {
    try {
      if (!peerConnection.current) {
        console.warn('No peer connection, signal ignored');
        return;
      }

      if (signal.type === 'answer') {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(signal.answer)
        );
        
        // Process any pending ICE candidates
        for (const candidate of pendingCandidates.current) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current = [];
      } else if (signal.type === 'ice-candidate') {
        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(signal.candidate)
          );
        } else {
          // Queue candidate if remote description not set yet
          pendingCandidates.current.push(signal.candidate);
        }
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }, []);

  const endCall = useCallback(() => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    pendingCandidates.current = [];
    setCallStatus('');
  }, [localStream, remoteStream]);

  return {
    localStream,
    remoteStream,
    callStatus,
    startCall,
    answerCall,
    handleSignal,
    endCall
  };
}
