import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '@/context/socket-context';
import PeerService from '@/services/peer.service';
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
  const isInitiator = useRef(false);

  // ── Media helpers ────────────────────────────────────────────────────────

  const getMedia = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    setMyStream(stream);
    return stream;
  }, []);

  const sendStreams = useCallback(
    (stream?: MediaStream) => {
      const s = stream ?? myStream;
      if (!s || !PeerService.peer) return;
      // Avoid duplicate senders
      const senders = PeerService.peer.getSenders();
      for (const track of s.getTracks()) {
        const alreadySending = senders.some((sender) => sender.track === track);
        if (!alreadySending) PeerService.peer.addTrack(track, s);
      }
    },
    [myStream],
  );

  // ── Trickle ICE ─────────────────────────────────────────────────────────

  useEffect(() => {
    PeerService.onIceCandidate = (candidate) => {
      if (remoteSocketId) {
        socket.emit('ice-candidate', { to: remoteSocketId, candidate });
      }
    };
  }, [remoteSocketId, socket]);

  // ── Incoming ICE candidates ──────────────────────────────────────────────

  const handleIceCandidate = useCallback(
    async ({ candidate }: IceCandidatePayload) => {
      await PeerService.addIceCandidate(candidate);
    },
    [],
  );

  // ── User joined ──────────────────────────────────────────────────────────

  const handleUserJoined = useCallback(({ id }: UserJoinedPayload) => {
    setRemoteSocketId(id);
    setStatus('connecting');
  }, []);

  // ── Initiate call ────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    if (!remoteSocketId) return;
    isInitiator.current = true;
    const stream = await getMedia();
    const offer = await PeerService.getOffer();
    if (offer) socket.emit('start-call', { to: remoteSocketId, offer });
    sendStreams(stream);
  }, [remoteSocketId, socket, getMedia, sendStreams]);

  // ── Receive offer ────────────────────────────────────────────────────────

  const handleIncomingCall = useCallback(
    async ({ from, offer }: OfferPayload) => {
      setRemoteSocketId(from);
      setStatus('connecting');
      isInitiator.current = false;
      const stream = await getMedia();
      const ans = await PeerService.getAnswer(offer);
      if (ans) socket.emit('answer', { to: from, ans });
      sendStreams(stream);
    },
    [socket, getMedia, sendStreams],
  );

  // ── Call accepted ────────────────────────────────────────────────────────

  const handleCallAccepted = useCallback(async ({ ans }: AnswerPayload) => {
    await PeerService.setRemoteDescription(ans);
    setStatus('connected');
  }, []);

  // ── Negotiation ──────────────────────────────────────────────────────────

  const handleNegoNeeded = useCallback(async () => {
    const offer = await PeerService.getOffer();
    if (remoteSocketId && offer) {
      socket.emit('peer-nego-needed', { offer, to: remoteSocketId });
    }
  }, [remoteSocketId, socket]);

  useEffect(() => {
    if (!PeerService.peer) return;
    PeerService.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () =>
      PeerService.peer?.removeEventListener(
        'negotiationneeded',
        handleNegoNeeded,
      );
  }, [handleNegoNeeded]);

  const handleNegoIncoming = useCallback(
    async ({ from, offer }: NegoPayload) => {
      const ans = await PeerService.getAnswer(offer);
      if (ans) socket.emit('peer-nego-done', { to: from, ans });
    },
    [socket],
  );

  const handleNegoFinal = useCallback(async ({ ans }: NegoFinalPayload) => {
    await PeerService.setRemoteDescription(ans);
  }, []);

  // ── Remote track ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!PeerService.peer) return;
    const onTrack = (ev: RTCTrackEvent) => {
      setRemoteStream(ev.streams[0]);
      setStatus('connected');
    };
    PeerService.peer.addEventListener('track', onTrack);
    return () => PeerService.peer?.removeEventListener('track', onTrack);
  }, []);

  // ── Peer disconnected ────────────────────────────────────────────────────

  const handlePeerDisconnected = useCallback(() => {
    setRemoteSocketId(null);
    setRemoteStream(null);
    setStatus('disconnected');
  }, []);

  // ── Register socket events ───────────────────────────────────────────────

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

  // ── Media controls ───────────────────────────────────────────────────────

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
    setStatus('idle');
    PeerService.reset();
  }, [myStream]);

  return {
    remoteSocketId,
    myStream,
    remoteStream,
    status,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    sendStreams,
    toggleAudio,
    toggleVideo,
    hangUp,
  };
}
