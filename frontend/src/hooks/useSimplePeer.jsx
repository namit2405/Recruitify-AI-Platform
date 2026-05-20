import { useState, useRef, useCallback, useEffect } from 'react';
import Peer from 'simple-peer';
import { toast } from 'sonner';

export function useSimplePeer(sendSignal) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  
  const peerRef = useRef(null);

  const startCall = useCallback(async (callType) => {
    try {
      setCallStatus('Getting media...');
      console.log('[SimplePeer] Starting call, type:', callType);
      
      // Get user media
      const constraints = callType === 'video' 
        ? { 
            video: { 
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          }
        : { 
            video: false, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      console.log('[SimplePeer] Got local stream');

      // Create peer as initiator
      const peer = new Peer({
        initiator: true,
        stream: stream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      peerRef.current = peer;

      // Send signal data
      peer.on('signal', (data) => {
        console.log('[SimplePeer] Sending signal:', data.type);
        sendSignal({
          type: 'peer-signal',
          signal: data
        });
      });

      // Receive stream
      peer.on('stream', (stream) => {
        console.log('[SimplePeer] Received remote stream');
        setRemoteStream(stream);
        setCallStatus('Connected');
      });

      // Handle connection
      peer.on('connect', () => {
        console.log('[SimplePeer] Peer connected');
        setCallStatus('Connected');
      });

      // Handle errors
      peer.on('error', (err) => {
        console.error('[SimplePeer] Error:', err);
        setCallStatus('Error: ' + err.message);
        toast.error('Call error: ' + err.message);
      });

      // Handle close
      peer.on('close', () => {
        console.log('[SimplePeer] Connection closed');
        endCall();
      });

      setCallStatus('Calling...');
      return stream;
    } catch (error) {
      console.error('[SimplePeer] Error starting call:', error);
      setCallStatus('Error: ' + error.message);
      throw error;
    }
  }, [sendSignal]);

  const answerCall = useCallback(async (callType, signalData) => {
    try {
      setCallStatus('Getting media...');
      console.log('[SimplePeer] Answering call, type:', callType);
      
      // Get user media
      const constraints = callType === 'video' 
        ? { 
            video: { 
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          }
        : { 
            video: false, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      console.log('[SimplePeer] Got local stream');

      // Create peer as receiver
      const peer = new Peer({
        initiator: false,
        stream: stream,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      });

      peerRef.current = peer;

      // Send signal data
      peer.on('signal', (data) => {
        console.log('[SimplePeer] Sending answer signal:', data.type);
        sendSignal({
          type: 'peer-signal',
          signal: data
        });
      });

      // Receive stream
      peer.on('stream', (stream) => {
        console.log('[SimplePeer] Received remote stream');
        setRemoteStream(stream);
        setCallStatus('Connected');
      });

      // Handle connection
      peer.on('connect', () => {
        console.log('[SimplePeer] Peer connected');
        setCallStatus('Connected');
      });

      // Handle errors
      peer.on('error', (err) => {
        console.error('[SimplePeer] Error:', err);
        setCallStatus('Error: ' + err.message);
        toast.error('Call error: ' + err.message);
      });

      // Handle close
      peer.on('close', () => {
        console.log('[SimplePeer] Connection closed');
        endCall();
      });

      // Signal the peer with the offer
      console.log('[SimplePeer] Signaling peer with offer');
      peer.signal(signalData);

      setCallStatus('Connecting...');
      return stream;
    } catch (error) {
      console.error('[SimplePeer] Error answering call:', error);
      setCallStatus('Error: ' + error.message);
      throw error;
    }
  }, [sendSignal]);

  const handleSignal = useCallback((signalData) => {
    if (peerRef.current) {
      console.log('[SimplePeer] Handling incoming signal');
      try {
        peerRef.current.signal(signalData);
      } catch (error) {
        console.error('[SimplePeer] Error handling signal:', error);
      }
    } else {
      console.warn('[SimplePeer] No peer connection to handle signal');
    }
  }, []);

  const endCall = useCallback(() => {
    console.log('[SimplePeer] Ending call');
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    setCallStatus('');
  }, [localStream, remoteStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

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
