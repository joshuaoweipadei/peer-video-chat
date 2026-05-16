import React from 'react'
import type { ControlsProps } from '../types'

// ── SVG Icon components ───────────────────────────────────────────────────────

function IconCamera({ on }: { on: boolean }): React.JSX.Element {
  return on ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  )
}

function IconMic({ on }: { on: boolean }): React.JSX.Element {
  return on ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  )
}

function IconPhone(): React.JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
    </svg>
  )
}

function IconOverlay(): React.JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h7m0 5h-7m3.5-2.5V14" />
    </svg>
  )
}

// ── Single control button ─────────────────────────────────────────────────────

interface CtrlBtnProps {
  onClick:  () => void
  label:    string
  active?:  boolean
  danger?:  boolean
  children: React.ReactNode
}

function CtrlBtn({
                   onClick,
                   label,
                   active  = true,
                   danger  = false,
                   children,
                 }: CtrlBtnProps): React.JSX.Element {
  const base  = 'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-cv-bg'
  const color = danger
    ? 'bg-cv-danger hover:opacity-80 focus:ring-cv-danger text-white'
    : active
      ? 'bg-cv-accent hover:opacity-80 focus:ring-cv-accent text-cv-bg'
      : 'bg-[#2a1a1f] border border-cv-danger text-cv-danger hover:bg-cv-danger hover:text-white focus:ring-cv-danger'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={!danger ? !active : undefined}
      className={`${base} ${color}`}
    >
      {children}
    </button>
  )
}

// ── Controls toolbar ──────────────────────────────────────────────────────────

/**
 * Controls
 * Fixed bottom bar: camera · mic · overlay toggle · leave call
 */
export default function Controls({
                                   isCameraOn,
                                   isMicOn,
                                   overlayEnabled,
                                   onToggleCamera,
                                   onToggleMic,
                                   onToggleOverlay,
                                   onLeave,
                                 }: ControlsProps): React.JSX.Element {
  return (
    <div
      role="toolbar"
      aria-label="Call controls"
      className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3.5 bg-cv-surface/80 backdrop-blur-md rounded-full border border-white/[0.07] shadow-2xl z-50"
    >
      <CtrlBtn
        onClick={onToggleCamera}
        active={isCameraOn}
        label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        <IconCamera on={isCameraOn} />
      </CtrlBtn>

      <CtrlBtn
        onClick={onToggleMic}
        active={isMicOn}
        label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        <IconMic on={isMicOn} />
      </CtrlBtn>

      <div className="w-px h-8 bg-white/[0.07] mx-1" aria-hidden="true" />

      <CtrlBtn
        onClick={onToggleOverlay}
        active={overlayEnabled}
        label={overlayEnabled ? 'Hide overlay' : 'Show overlay'}
      >
        <IconOverlay />
      </CtrlBtn>

      <div className="w-px h-8 bg-white/[0.07] mx-1" aria-hidden="true" />

      <CtrlBtn onClick={onLeave} danger label="Leave call">
        <IconPhone />
      </CtrlBtn>
    </div>
  )
}