import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  mirrored?: boolean;
}

export default function VideoTile({
  stream,
  label,
  muted = false,
  mirrored = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-cv-card border border-white/[0.07] aspect-video">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''}`}
          aria-label={`${label} video feed`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-cv-surface border border-white/[0.07] flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-cv-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <p className="text-[11px] text-cv-muted font-mono">
              {label} · no stream
            </p>
          </div>
        </div>
      )}

      {/* Label badge */}
      <div className="absolute top-3 left-3">
        <span className="text-[10px] font-mono text-cv-muted bg-cv-bg/70 backdrop-blur-sm border border-white/[0.07] px-2 py-0.5 rounded-full">
          {label}
        </span>
      </div>
    </div>
  );
}
