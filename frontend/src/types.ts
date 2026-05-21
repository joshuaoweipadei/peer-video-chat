// // ─────────────────────────────────────────────────────────────────────────────
// // PeerChat CV — Shared Types
// // Single source of truth for every interface used across hooks + components.
// // ─────────────────────────────────────────────────────────────────────────────
//
// // ── Detection / Canvas ────────────────────────────────────────────────────────
//
// import React from 'react';
//
// /** A detection class with a display name and hex colour */
// export interface DetectionClass {
//   readonly name: string;
//   readonly color: string;
// }
//
// /** A tracked object rendered on the canvas each frame */
// export interface Detection {
//   id: number;
//   cls: DetectionClass;
//   /** Current rendered position (lerped) */
//   x: number;
//   y: number;
//   w: number;
//   h: number;
//   /** Physics target position */
//   tx: number;
//   ty: number;
//   /** Velocity */
//   vx: number;
//   vy: number;
//   /** Confidence score 0–100 */
//   conf: number;
//   /** Frames alive */
//   age: number;
//   /** Max frames before expiry */
//   life: number;
// }
//
// /** A single point used to build a motion trail */
// export interface TrailPoint {
//   x: number;
//   y: number;
// }
//
// /** Map of trackId → trail history */
// export type TrailMap = Record<number, TrailPoint[]>;
//
// /** All configurable options for the canvas overlay */
// export interface OverlayOptions {
//   enabled: boolean;
//   showBoxes: boolean;
//   showIds: boolean;
//   showConf: boolean;
//   showLabel: boolean;
//   showTrail: boolean;
//   /** 0–100: minimum confidence to render */
//   threshold: number;
//   /** New detections spawned per second */
//   spawnRate: number;
//   /** Maximum simultaneous tracked objects */
//   maxObjects: number;
// }
//
// /** Snapshot returned from useCanvasOverlay for the sidebar panel */
// export interface OverlaySnapshot {
//   detections: Detection[];
//   fps: number;
// }
//
// // ── WebRTC / Signaling ────────────────────────────────────────────────────────
//
// /** All values returned from useWebRTC */
// export interface UseWebRTCReturn {
//   isConnected: boolean;
//   remoteJoined: boolean;
//   isCameraOn: boolean;
//   isMicOn: boolean;
//   error: string | null;
//   toggleCamera: () => void;
//   toggleMic: () => void;
//   leaveRoom: () => Promise<void>;
// }
//
// /** Props passed into useWebRTC */
// export interface UseWebRTCProps {
//   roomId: string;
//   localVideoRef: React.RefObject<HTMLVideoElement | null>;
//   remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
// }
//
// // ── RTM Signaling message shapes ─────────────────────────────────────────────
// // v2: every signal carries a `from` field (the sender's uid)
// // so receivers can ignore their own echoed messages.
//
// interface SignalOffer {
//   type: 'offer';
//   from: string;
//   offer: RTCSessionDescriptionInit;
// }
//
// interface SignalAnswer {
//   type: 'answer';
//   from: string;
//   answer: RTCSessionDescriptionInit;
// }
//
// interface SignalCandidate {
//   type: 'candidate';
//   from: string;
//   candidate: RTCIceCandidateInit;
// }
//
// interface SignalJoin {
//   type: 'join';
//   from: string;
// }
//
// export type SignalMessage =
//   | SignalOffer
//   | SignalAnswer
//   | SignalCandidate
//   | SignalJoin;
//
// // ── Component Props ───────────────────────────────────────────────────────────
//
// export interface VideoCanvasProps {
//   videoRef: React.RefObject<HTMLVideoElement | null>;
//   canvasRef: React.RefObject<HTMLCanvasElement | null>;
//   muted?: boolean;
//   label?: string;
//   overlayOn?: boolean;
//   className?: string;
//   pip?: boolean;
// }
//
// export interface ControlsProps {
//   isCameraOn: boolean;
//   isMicOn: boolean;
//   overlayEnabled: boolean;
//   onToggleCamera: () => void;
//   onToggleMic: () => void;
//   onToggleOverlay: () => void;
//   onLeave: () => void;
// }
//
// export interface OverlayPanelProps {
//   overlayOptions: OverlayOptions;
//   setOverlay: React.Dispatch<React.SetStateAction<OverlayOptions>>;
//   getSnapshot: () => OverlaySnapshot;
//   remoteJoined: boolean;
//   totalSeen: number;
// }

//-----------------------------------------------------
//-----------------------------------------------------
//-----------------------------------------------------
// ── Socket event payloads ──────────────────────────────────────────────────

export interface UserJoinedPayload {
  email: string;
  id: string;
}

export interface OfferPayload {
  from: string;
  offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  from: string;
  ans: RTCSessionDescriptionInit;
}

export interface NegoPayload {
  from: string;
  offer: RTCSessionDescriptionInit;
}

export interface NegoFinalPayload {
  ans: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  from: string;
  candidate: RTCIceCandidateInit;
}

export interface JoinRoomPayload {
  email: string;
  room: string;
}

// ── App state ─────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected';
