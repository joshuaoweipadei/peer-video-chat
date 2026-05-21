// import React from 'react';
// import type { ControlsProps } from '../types';
//
// // ── SVG Icon components ───────────────────────────────────────────────────────
//
// function IconCamera({ on }: { on: boolean }): React.JSX.Element {
//   return on ? (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
//       />
//     </svg>
//   ) : (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
//       />
//       <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
//     </svg>
//   );
// }
//
// function IconMic({ on }: { on: boolean }): React.JSX.Element {
//   return on ? (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
//       />
//     </svg>
//   ) : (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
//       />
//       <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
//     </svg>
//   );
// }
//
// function IconPhone(): React.JSX.Element {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
//       />
//     </svg>
//   );
// }
//
// function IconOverlay(): React.JSX.Element {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       className="h-5 w-5"
//       fill="none"
//       viewBox="0 0 24 24"
//       stroke="currentColor"
//       strokeWidth={2}
//       aria-hidden="true"
//     >
//       <rect x="3" y="3" width="7" height="7" rx="1" />
//       <rect x="14" y="3" width="7" height="7" rx="1" />
//       <rect x="3" y="14" width="7" height="7" rx="1" />
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M14 14h7m0 5h-7m3.5-2.5V14"
//       />
//     </svg>
//   );
// }
//
// // ── Single control button ─────────────────────────────────────────────────────
//
// interface CtrlBtnProps {
//   onClick: () => void;
//   label: string;
//   active?: boolean;
//   danger?: boolean;
//   children: React.ReactNode;
// }
//
// function CtrlBtn({
//   onClick,
//   label,
//   active = true,
//   danger = false,
//   children,
// }: CtrlBtnProps): React.JSX.Element {
//   const base =
//     'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-cv-bg';
//   const color = danger
//     ? 'bg-cv-danger hover:opacity-80 focus:ring-cv-danger text-white'
//     : active
//       ? 'bg-cv-accent hover:opacity-80 focus:ring-cv-accent text-cv-bg'
//       : 'bg-[#2a1a1f] border border-cv-danger text-cv-danger hover:bg-cv-danger hover:text-white focus:ring-cv-danger';
//
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       aria-label={label}
//       aria-pressed={!danger ? !active : undefined}
//       className={`${base} ${color}`}
//     >
//       {children}
//     </button>
//   );
// }
//
// // ── Controls toolbar ──────────────────────────────────────────────────────────
//
// /**
//  * Controls
//  * Fixed bottom bar: camera · mic · overlay toggle · leave call
//  */
// export default function Controls({
//   isCameraOn,
//   isMicOn,
//   overlayEnabled,
//   onToggleCamera,
//   onToggleMic,
//   onToggleOverlay,
//   onLeave,
// }: ControlsProps): React.JSX.Element {
//   return (
//     <div
//       role="toolbar"
//       aria-label="Call controls"
//       className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3.5 bg-cv-surface/80 backdrop-blur-md rounded-full border border-white/[0.07] shadow-2xl z-50"
//     >
//       <CtrlBtn
//         onClick={onToggleCamera}
//         active={isCameraOn}
//         label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
//       >
//         <IconCamera on={isCameraOn} />
//       </CtrlBtn>
//
//       <CtrlBtn
//         onClick={onToggleMic}
//         active={isMicOn}
//         label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
//       >
//         <IconMic on={isMicOn} />
//       </CtrlBtn>
//
//       <div className="w-px h-8 bg-white/[0.07] mx-1" aria-hidden="true" />
//
//       <CtrlBtn
//         onClick={onToggleOverlay}
//         active={overlayEnabled}
//         label={overlayEnabled ? 'Hide overlay' : 'Show overlay'}
//       >
//         <IconOverlay />
//       </CtrlBtn>
//
//       <div className="w-px h-8 bg-white/[0.07] mx-1" aria-hidden="true" />
//
//       <CtrlBtn onClick={onLeave} danger label="Leave call">
//         <IconPhone />
//       </CtrlBtn>
//     </div>
//   );
// }

import React from 'react';

interface ControlsProps {
  hasStream: boolean;
  hasRemote: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartCall: () => void;
  onHangUp: () => void;
}

interface CtrlBtnProps {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}

function CtrlBtn({
  onClick,
  active = true,
  danger = false,
  label,
  children,
}: CtrlBtnProps) {
  const base =
    'relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-accent active:scale-95';

  const color = danger
    ? 'bg-cv-danger/20 border border-cv-danger/50 text-cv-danger hover:bg-cv-danger hover:text-white'
    : active
      ? 'bg-white/[0.08] border border-white/[0.12] text-cv-text hover:bg-white/[0.15]'
      : 'bg-cv-danger/10 border border-cv-danger/30 text-cv-danger hover:bg-cv-danger/20';

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
  );
}

export default function Controls({
  hasStream,
  hasRemote,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onStartCall,
  onHangUp,
}: ControlsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Call controls"
      className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3.5 bg-cv-surface/80 backdrop-blur-md rounded-full border border-white/[0.07] shadow-2xl z-50"
    >
      {hasStream && (
        <>
          {/* Mic */}
          <CtrlBtn
            onClick={onToggleAudio}
            active={isAudioEnabled}
            label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                />
              </svg>
            )}
          </CtrlBtn>

          {/* Camera */}
          <CtrlBtn
            onClick={onToggleVideo}
            active={isVideoEnabled}
            label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
                />
              </svg>
            )}
          </CtrlBtn>

          <div className="w-px h-8 bg-white/[0.07] mx-1" aria-hidden="true" />

          {/* Hang up */}
          <CtrlBtn onClick={onHangUp} danger label="End call">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z"
              />
            </svg>
          </CtrlBtn>
        </>
      )}

      {/* Start call — shown when there's a remote peer but no stream yet */}
      {!hasStream && hasRemote && (
        <button
          type="button"
          onClick={onStartCall}
          className="flex items-center gap-2 px-5 py-2.5 bg-cv-accent text-cv-bg font-display font-bold text-[13px] rounded-full hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-accent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.054-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
          Start Call
        </button>
      )}
    </div>
  );
}
