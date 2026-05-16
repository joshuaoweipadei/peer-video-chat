import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useWebRTC }        from '../hooks/useWebRTC'
import { useCanvasOverlay } from '../hooks/useCanvasOverlay'
import VideoCanvas          from '../components/VideoCanvas'
import Controls             from '../components/Controls'
import OverlayPanel         from '../components/OverlayPanel'
import type { OverlayOptions } from '../types'

// ── Default overlay configuration ─────────────────────────────────────────────
const DEFAULT_OVERLAY: OverlayOptions = {
  enabled:    true,
  showBoxes:  true,
  showIds:    true,
  showConf:   true,
  showLabel:  true,
  showTrail:  false,
  threshold:  40,
  spawnRate:  3,
  maxObjects: 10,
}

// ── PiP overlay config — fewer objects, slower spawn ─────────────────────────
const PIP_OVERLAY_OVERRIDES: Partial<OverlayOptions> = {
  spawnRate:  1,
  maxObjects: 3,
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate   = useNavigate()

  // Guard: roomId must be defined (route param)
  if (!roomId) {
    void navigate('/lobby')
    return <></>
  }

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const remoteVideoRef  = useRef<HTMLVideoElement>(null)
  const localVideoRef   = useRef<HTMLVideoElement>(null)
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null)
  const localCanvasRef  = useRef<HTMLCanvasElement>(null)

  // ── State ──────────────────────────────────────────────────────────────────
  const [overlayOptions, setOverlayOptions] = useState<OverlayOptions>(DEFAULT_OVERLAY)
  const [sidebarOpen,    setSidebarOpen]    = useState<boolean>(true)
  const [totalSeen,      setTotalSeen]      = useState<number>(0)
  const [clock,          setClock]          = useState<string>('')

  // ── WebRTC hook ────────────────────────────────────────────────────────────
  const {
    isConnected,
    remoteJoined,
    isCameraOn,
    isMicOn,
    error,
    toggleCamera,
    toggleMic,
    leaveRoom,
  } = useWebRTC({ roomId, localVideoRef, remoteVideoRef })

  // ── Canvas overlay — remote (full-screen) ─────────────────────────────────
  const { getSnapshot: getRemoteSnapshot, detectionsRef: remoteDetRef } =
    useCanvasOverlay({
      canvasRef: remoteCanvasRef,
      videoRef:  remoteVideoRef,
      options:   overlayOptions,
    })

  // ── Canvas overlay — local PiP ────────────────────────────────────────────
  const { detectionsRef: localDetRef } =
    useCanvasOverlay({
      canvasRef: localCanvasRef,
      videoRef:  localVideoRef,
      options:   { ...overlayOptions, ...PIP_OVERLAY_OVERRIDES },
    })

  // ── Track total objects seen across both canvases ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const remote = remoteDetRef.current.length
      const local  = localDetRef.current.length
      setTotalSeen((prev) => Math.max(prev, remote + local))
    }, 1000)
    return () => clearInterval(id)
  }, [remoteDetRef, localDetRef])

  // ── HUD clock ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = (): void => {
      const d = new Date()
      const pad = (n: number): string => String(n).padStart(2, '0')
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Leave call ─────────────────────────────────────────────────────────────
  const handleLeave = useCallback(async (): Promise<void> => {
    await leaveRoom()
    void navigate('/lobby')
  }, [leaveRoom, navigate])

  // ── Overlay toggle ─────────────────────────────────────────────────────────
  const handleToggleOverlay = useCallback((): void => {
    setOverlayOptions((o) => ({ ...o, enabled: !o.enabled }))
  }, [])

  // ── Sidebar toggle ─────────────────────────────────────────────────────────
  const handleToggleSidebar = useCallback((): void => {
    setSidebarOpen((o) => !o)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cv-bg">

      {/* ── Main video area ── */}
      <div className="relative flex-1 min-w-0">

        {/* Remote full-screen video + canvas */}
        <VideoCanvas
          videoRef={remoteVideoRef}
          canvasRef={remoteCanvasRef}
          muted={false}
          label="Remote participant video stream"
          overlayOn={overlayOptions.enabled}
          className="w-full h-full"
        />

        {/* Waiting state — no remote peer yet */}
        {!remoteJoined && !error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            aria-live="polite"
            style={{
              background: 'repeating-linear-gradient(45deg,#09090c 0,#09090c 12px,#0c0d10 12px,#0c0d10 24px)',
            }}
          >
            <div className="relative flex items-center justify-center mb-6">
              <span
                className="absolute w-20 h-20 rounded-full bg-cv-accent/20 animate-ping"
                aria-hidden="true"
              />
              <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-cv-accent/10 border border-cv-accent/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-cv-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </span>
            </div>
            <p className="font-display text-lg font-bold text-cv-text mb-1">
              Waiting for peer…
            </p>
            <p className="text-[12px] text-cv-muted font-mono mb-4">
              Share this room ID to start the call
            </p>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(roomId)}
              aria-label={`Room ID: ${roomId}. Click to copy.`}
              className="px-4 py-2 bg-cv-card border border-cv-accent/30 rounded-lg
                text-cv-accent font-mono text-[12px] hover:bg-cv-accent/10
                transition-colors focus:outline-none focus:ring-2 focus:ring-cv-accent"
            >
              {roomId} — click to copy
            </button>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6"
          >
            <div className="bg-cv-danger/10 border border-cv-danger/30 rounded-2xl px-8 py-6 max-w-sm text-center">
              <p className="text-cv-danger font-mono font-semibold text-sm mb-1">
                Connection Error
              </p>
              <p className="text-cv-text text-[12px] font-mono">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void navigate('/lobby')}
              className="mt-4 px-6 py-2.5 bg-cv-accent text-cv-bg font-mono text-[13px]
                rounded-lg hover:opacity-90 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-cv-accent"
            >
              Back to Lobby
            </button>
          </div>
        )}

        {/* Local PiP — top-left */}
        <div
          className="pip-wrapper z-10 bg-white"
          aria-label="Your local video (picture-in-picture)"
        >
          <VideoCanvas
            videoRef={localVideoRef}
            canvasRef={localCanvasRef}
            muted={true}
            label="Your local camera feed"
            overlayOn={overlayOptions.enabled}
          />
        </div>

        {/* HUD — top-right */}
        <div
          className="absolute top-4 right-4 z-20 text-[10px] font-mono text-cv-accent
            leading-relaxed text-right pointer-events-none select-none"
          aria-label="System HUD"
          style={{ textShadow: '0 0 8px rgba(0,229,160,0.3)' }}
        >
          <div>PEERCHAT·CV v1.0</div>
          <div>{clock}</div>
          <div>
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                isConnected
                  ? 'bg-cv-accent animate-ping-slow'
                  : 'bg-cv-amber'
              }`}
              aria-hidden="true"
            />
            {remoteJoined
              ? isConnected ? 'CONNECTED' : 'HANDSHAKING'
              : 'STANDBY'}
          </div>
        </div>

        {/* Sidebar toggle button */}
        <button
          type="button"
          onClick={handleToggleSidebar}
          aria-label={sidebarOpen ? 'Hide overlay panel' : 'Show overlay panel'}
          className="absolute top-4 right-40 z-20 p-2 bg-cv-card/80 border
            border-white/[0.07] rounded-lg text-cv-muted hover:text-cv-accent
            transition-colors focus:outline-none focus:ring-2 focus:ring-cv-accent
            hidden sm:block"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Controls bar */}
        <Controls
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          overlayEnabled={overlayOptions.enabled}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onToggleOverlay={handleToggleOverlay}
          onLeave={() => void handleLeave()}
        />
      </div>

      {/* Sidebar panel */}
      {sidebarOpen && (
        <div className="w-64 shrink-0 hidden sm:block animate-slide-up">
          <OverlayPanel
            overlayOptions={overlayOptions}
            setOverlay={setOverlayOptions}
            getSnapshot={getRemoteSnapshot}
            remoteJoined={remoteJoined}
            totalSeen={totalSeen}
          />
        </div>
      )}
    </div>
  )
}
export default Room
