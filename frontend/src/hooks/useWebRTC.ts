import { useEffect, useRef, useState, useCallback } from 'react'
import AgoraRTM from 'agora-rtm-sdk'
import type { RTMClient, RTMEvents } from 'agora-rtm-sdk'
import type { UseWebRTCProps, UseWebRTCReturn } from '../types'

const BACKEND_URL = import.meta.env['VITE_BACKEND_URL'] as string

async function fetchRtmToken(uid: string): Promise<string> {
  const res = await fetch(
    `${BACKEND_URL}/api/agora/rtm-token?uid=${encodeURIComponent(uid)}`
  )
  if (!res.ok) throw new Error('Failed to fetch RTM token')
  const data = await res.json() as { token: string }
  return data.token
}

// ─────────────────────────────────────────────────────────────────────────────
// Agora RTM SDK v2.x — API is completely different from v1.x
//
// v2 exports (agora-rtm.d.ts last line):
//   export { RTMClient, RTMEvents, _default as default }
//   export type { PublishOptions, SubscribeOptions, RTMConfig, ... }
//
// Key v2 differences vs v1:
//   - No createInstance()  →  use: new AgoraRTM.RTM(appId, userId)
//   - No createChannel()   →  use: client.subscribe(channelName)
//   - No sendMessageToPeer →  use: client.publish(channelName, message)
//   - No MemberJoined      →  use: presence events (addEventListener 'presence')
//   - No MessageFromPeer   →  use: addEventListener('message', handler)
//   - Message payload      →  event.message (string | Uint8Array), event.publisher
//   - Login                →  client.login({ token? }) — userId passed in constructor
//
// Since v2's peer-to-peer signaling model changed significantly (no direct
// sendMessageToPeer), we implement signaling by publishing JSON to a
// dedicated signaling channel that both peers subscribe to.
// ─────────────────────────────────────────────────────────────────────────────

const APP_ID: string =
  (import.meta.env['VITE_AGORA_APP_ID'] as string | undefined) ?? 'YOUR-APP-ID'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
}

const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width:      { min: 640, ideal: 1280, max: 1920 },
    height:     { min: 480, ideal: 720,  max: 1080 },
    facingMode: 'user',
  },
  audio: true,
}

// ─── Signaling message types (our own discriminated union) ────────────────────
// These are serialised to JSON and published to the RTM channel as strings.
// Identical to what's in src/types/index.ts — defined here to be self-contained.
type SignalOffer     = { type: 'offer';     from: string; offer: RTCSessionDescriptionInit }
type SignalAnswer    = { type: 'answer';    from: string; answer: RTCSessionDescriptionInit }
type SignalCandidate = { type: 'candidate'; from: string; candidate: RTCIceCandidateInit }
type SignalJoin      = { type: 'join';      from: string }
type Signal = SignalOffer | SignalAnswer | SignalCandidate | SignalJoin

export function useWebRTC({
  roomId,
  localVideoRef,
  remoteVideoRef,
}: UseWebRTCProps): UseWebRTCReturn {

  const [isConnected,  setIsConnected]  = useState<boolean>(false)
  const [remoteJoined, setRemoteJoined] = useState<boolean>(false)
  const [isCameraOn,   setIsCameraOn]   = useState<boolean>(true)
  const [isMicOn,      setIsMicOn]      = useState<boolean>(true)
  const [error,        setError]        = useState<string | null>(null)

  // RTMClient is the class type from v2; RTM is the concrete class
  const clientRef         = useRef<RTMClient | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef    = useRef<MediaStream | null>(null)
  const remoteStreamRef   = useRef<MediaStream | null>(null)

  // Stable UID for this session — used as userId in v2 constructor
  const uid = useRef<string>(`user_${Math.floor(Math.random() * 10000)}`).current

  // ── Publish a signal to the shared room channel ───────────────────────────
  const publish = useCallback(async (signal: Signal): Promise<void> => {
    try {
      await clientRef.current?.publish(roomId, JSON.stringify(signal))
    } catch (err) {
      console.error('[useWebRTC] publish error:', err)
    }
  }, [roomId])

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    // Prepare remote stream
    const remoteStream = new MediaStream()
    remoteStreamRef.current = remoteStream
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
    setRemoteJoined(true)

    // Ensure local stream is ready
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true, audio: false,
      })
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    }

    localStreamRef.current.getTracks().forEach((track) => {
      if (localStreamRef.current) pc.addTrack(track, localStreamRef.current)
    })

    pc.ontrack = (event: RTCTrackEvent): void => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track)
      })
    }

    pc.onicecandidate = async (event: RTCPeerConnectionIceEvent): Promise<void> => {
      if (event.candidate) {
        await publish({
          type:      'candidate',
          from:      uid,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.onconnectionstatechange = (): void => {
      if (pc.connectionState === 'connected')  setIsConnected(true)
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        setIsConnected(false)
      }
    }

    return pc
  }, [localVideoRef, remoteVideoRef, publish, uid])

  // ── SDP Offer (caller) ────────────────────────────────────────────────────
  const createOffer = useCallback(async (): Promise<void> => {
    const pc    = await createPeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await publish({ type: 'offer', from: uid, offer })
  }, [createPeerConnection, publish, uid])

  // ── SDP Answer (callee) ───────────────────────────────────────────────────
  const createAnswer = useCallback(async (
    offer: RTCSessionDescriptionInit,
  ): Promise<void> => {
    const pc     = await createPeerConnection()
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await publish({ type: 'answer', from: uid, answer })
  }, [createPeerConnection, publish, uid])

  const addAnswer = useCallback(async (
    answer: RTCSessionDescriptionInit,
  ): Promise<void> => {
    const pc = peerConnectionRef.current
    if (pc && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(answer)
    }
  }, [])

  // ── Handle incoming RTM v2 message events ─────────────────────────────────
  const handleMessage = useCallback(async (
    event: RTMEvents.MessageEvent,
  ): Promise<void> => {
    // Ignore our own messages (v2 echoes published messages back)
    if (event.publisher === uid) return

    try {
      const raw = typeof event.message === 'string'
        ? event.message
        : new TextDecoder().decode(event.message)

      const signal = JSON.parse(raw) as Signal

      if (signal.type === 'join') {
        // A peer joined — we become the caller and send an offer
        await createOffer()
      } else if (signal.type === 'offer') {
        await createAnswer(signal.offer)
      } else if (signal.type === 'answer') {
        await addAnswer(signal.answer)
      } else if (signal.type === 'candidate' && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(signal.candidate),
        )
      }
    } catch (err) {
      console.error('[useWebRTC] handleMessage error:', err)
    }
  }, [uid, createOffer, createAnswer, addAnswer])

  // ── Handle presence events (member join/leave) ────────────────────────────
  const handlePresence = useCallback((
    event: RTMEvents.PresenceEvent,
  ): void => {
    if (event.eventType === 'REMOTE_LEAVE' || event.eventType === 'REMOTE_TIMEOUT') {
      setRemoteJoined(false)
      setIsConnected(false)
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      peerConnectionRef.current?.close()
      peerConnectionRef.current = null
    }
  }, [remoteVideoRef])

  // ── Init on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return

    let mounted = true

    const init = async (): Promise<void> => {
      try {
        // 1. Get local camera + mic
        const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)
        if (!mounted) return
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        // 2. Create RTM v2 client: new AgoraRTM.RTM(appId, userId)
        const client = new AgoraRTM.RTM(APP_ID, uid)
        clientRef.current = client

        // 3. Bind events BEFORE login (v2 best practice)
        client.addEventListener('message', (evt) => void handleMessage(evt))
        client.addEventListener('presence', handlePresence)

        // 4. Login — no uid in login() for v2 (it's in the constructor)
        const token = await fetchRtmToken(uid)
        await client.login({ token })

        await new Promise(r => setTimeout(r, 500))

        // 5. Subscribe to the room channel (replaces createChannel + join in v1)
        await client.subscribe(roomId, {
          withPresence: true,   // enables presence events (join/leave)
          withMessage:  true,   // enables message events
        })

        // 6. Announce we joined so the other peer creates an offer
        await client.publish(roomId, JSON.stringify({
          type: 'join',
          from: uid,
        } satisfies SignalJoin))
      } catch (err) {
        if (!mounted) return
        const domErr = err as DOMException
        setError(
          domErr.name === 'NotAllowedError'
            ? 'Camera/mic permission denied. Please allow access and reload.'
            : 'Connection failed. Check your Agora App ID and network.',
        )
        console.error('[useWebRTC] init error:', err)
      }
    }

    void init()

    return (): void => {
      mounted = false
      void clientRef.current?.unsubscribe(roomId)
      void clientRef.current?.logout()
      peerConnectionRef.current?.close()
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleCamera = useCallback((): void => {
    const track = localStreamRef.current?.getTracks().find((t) => t.kind === 'video')
    if (track) { track.enabled = !track.enabled; setIsCameraOn(track.enabled) }
  }, [])

  const toggleMic = useCallback((): void => {
    const track = localStreamRef.current?.getTracks().find((t) => t.kind === 'audio')
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled) }
  }, [])

  const leaveRoom = useCallback(async (): Promise<void> => {
    await clientRef.current?.unsubscribe(roomId)
    await clientRef.current?.logout()
    peerConnectionRef.current?.close()
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
  }, [roomId])

  return { isConnected, remoteJoined, isCameraOn, isMicOn, error, toggleCamera, toggleMic, leaveRoom }
}