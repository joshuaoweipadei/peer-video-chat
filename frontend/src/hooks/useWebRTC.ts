import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '@/context/socket-context';
import peer from '@/services/peer.service';
import type {
  UserJoinedPayload,
  OfferPayload,
  AnswerPayload,
  NegoPayload,
  NegoFinalPayload,
  IceCandidatePayload,
  ConnectionStatus,
} from '@/types';

export function useWebRTC() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // true = we initiated the call (impolite peer in perfect negotiation)
  const isPolite = useRef(false);
  const remoteSocketIdRef = useRef<string | null>(null);

  // Keep ref in sync so callbacks always have latest value
  useEffect(() => {
    remoteSocketIdRef.current = remoteSocketId;
  }, [remoteSocketId]);

  // ── Get user media ────────────────────────────────────────────────────────

  const getMedia = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
      },
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    });
    setMyStream(stream);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    return stream;
  }, []);

  // ── Trickle ICE ───────────────────────────────────────────────────────────

  useEffect(() => {
    peer.onIceCandidate = (candidate) => {
      const to = remoteSocketIdRef.current;
      if (to) socket.emit('ice-candidate', { to, candidate });
    };
  }, [socket]);

  // ── Remote track ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!peer.peer) return;
    const onTrack = (ev: RTCTrackEvent) => {
      setRemoteStream(ev.streams[0]);
      setStatus('connected');
    };
    peer.peer.addEventListener('track', onTrack);
    return () => peer.peer?.removeEventListener('track', onTrack);
  }, []);

  // ── Negotiation needed ────────────────────────────────────────────────────

  const handleNegoNeeded = useCallback(async () => {
    const to = remoteSocketIdRef.current;
    if (!to) return;
    const offer = await peer.getOffer();
    if (offer) socket.emit('peer-nego-needed', { offer, to });
  }, [socket]);

  useEffect(() => {
    if (!peer.peer) return;
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () =>
      peer.peer?.removeEventListener('negotiationneeded', handleNegoNeeded);
  }, [handleNegoNeeded]);

  // ── User joined ───────────────────────────────────────────────────────────

  const handleUserJoined = useCallback(({ id }: UserJoinedPayload) => {
    setRemoteSocketId(id);
    setStatus('connecting');
  }, []);

  // ── Start call (we are the caller = impolite peer) ────────────────────────

  const startCall = useCallback(async () => {
    const to = remoteSocketIdRef.current;
    if (!to) return;
    isPolite.current = false;

    const stream = await getMedia();
    peer.addTracks(stream); // ← adds tracks once, triggers negotiationneeded
    // negotiationneeded fires → handleNegoNeeded → emits offer automatically
  }, [getMedia]);

  // ── Incoming call (we are the callee = polite peer) ───────────────────────

  const handleIncomingCall = useCallback(
    async ({ from, offer }: OfferPayload) => {
      setRemoteSocketId(from);
      remoteSocketIdRef.current = from;
      setStatus('connecting');
      isPolite.current = true;

      const stream = await getMedia();
      peer.addTracks(stream); // ← adds tracks once before answering

      const ans = await peer.getAnswer(offer, isPolite.current);
      if (ans) socket.emit('answer', { to: from, ans });
    },
    [socket, getMedia],
  );

  // ── Call accepted ─────────────────────────────────────────────────────────

  const handleCallAccepted = useCallback(async ({ ans }: AnswerPayload) => {
    await peer.setRemoteDescription(ans);
    setStatus('connected');
  }, []);

  // ── Re-negotiation ────────────────────────────────────────────────────────

  const handleNegoIncoming = useCallback(
    async ({ from, offer }: NegoPayload) => {
      const ans = await peer.getAnswer(offer, isPolite.current);
      if (ans) socket.emit('peer-nego-done', { to: from, ans });
    },
    [socket],
  );

  const handleNegoFinal = useCallback(async ({ ans }: NegoFinalPayload) => {
    await peer.setRemoteDescription(ans);
  }, []);

  // ── ICE candidates ────────────────────────────────────────────────────────

  const handleIceCandidate = useCallback(
    async ({ candidate }: IceCandidatePayload) => {
      await peer.addIceCandidate(candidate);
    },
    [],
  );

  // ── Peer disconnected ─────────────────────────────────────────────────────

  const handlePeerDisconnected = useCallback(() => {
    setRemoteSocketId(null);
    remoteSocketIdRef.current = null;
    setRemoteStream(null);
    setStatus('disconnected');
  }, []);

  // ── Register all socket events ────────────────────────────────────────────

  useEffect(() => {
    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleIncomingCall);
    socket.on('answer', handleCallAccepted);
    socket.on('peer-nego-needed', handleNegoIncoming);
    socket.on('peer-nego-final', handleNegoFinal);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('peer-disconnected', handlePeerDisconnected);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleIncomingCall);
      socket.off('answer', handleCallAccepted);
      socket.off('peer-nego-needed', handleNegoIncoming);
      socket.off('peer-nego-final', handleNegoFinal);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('peer-disconnected', handlePeerDisconnected);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoIncoming,
    handleNegoFinal,
    handleIceCandidate,
    handlePeerDisconnected,
  ]);

  // ── Media controls ────────────────────────────────────────────────────────

  const toggleAudio = useCallback(() => {
    if (!myStream) return;
    const track = myStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
  }, [myStream]);

  const toggleVideo = useCallback(() => {
    if (!myStream) return;
    const track = myStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
  }, [myStream]);

  const hangUp = useCallback(() => {
    myStream?.getTracks().forEach((t) => t.stop());
    setMyStream(null);
    setRemoteStream(null);
    setRemoteSocketId(null);
    remoteSocketIdRef.current = null;
    setStatus('idle');
    peer.reset();
  }, [myStream]);

  return {
    remoteSocketId,
    myStream,
    remoteStream,
    status,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    toggleAudio,
    toggleVideo,
    hangUp,
  };
}
