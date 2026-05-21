import { useNavigate, useParams } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoTile from '@/components/VideoTile';
import Controls from '@/components/Controls';
import type { ConnectionStatus } from '@/types';

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ConnectionStatus }) {
  const map: Record<
    ConnectionStatus,
    { label: string; cls: string; dot: string }
  > = {
    idle: {
      label: 'Waiting for peer',
      cls: 'text-cv-muted  border-white/[0.07]',
      dot: 'bg-cv-muted',
    },
    connecting: {
      label: 'Connecting…',
      cls: 'text-cv-warn   border-cv-warn/30',
      dot: 'bg-cv-warn animate-pulse_dot',
    },
    connected: {
      label: 'Connected',
      cls: 'text-cv-accent border-cv-accent/30',
      dot: 'bg-cv-accent',
    },
    disconnected: {
      label: 'Peer left',
      cls: 'text-cv-danger border-cv-danger/30',
      dot: 'bg-cv-danger',
    },
  };
  const { label, cls, dot } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono border rounded-full px-3 py-1 ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Room page ──────────────────────────────────────────────────────────────
export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
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
  } = useWebRTC();

  const handleHangUp = () => {
    hangUp();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cv-bg">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(0,229,160,1) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0,229,160,1) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 pt-6 pb-32">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to lobby"
              className="text-cv-muted hover:text-cv-text transition-colors"
            >
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-[15px] font-display font-bold text-cv-text leading-none">
                Peer<span className="text-cv-accent">Chat</span>
              </h1>
              <p className="text-[10px] font-mono text-cv-muted mt-0.5">
                room · <span className="text-cv-accent">{roomId}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </header>

        {/* Video grid */}
        {!myStream && !remoteSocketId && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fadein">
            <div className="w-16 h-16 rounded-2xl bg-cv-surface border border-white/[0.07] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-cv-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <div>
              <p className="text-cv-text font-display font-bold text-lg">
                Waiting for peer
              </p>
              <p className="text-cv-muted text-[12px] font-mono mt-1">
                Share room ID <span className="text-cv-accent">{roomId}</span>{' '}
                to invite someone
              </p>
            </div>
          </div>
        )}

        {/* One stream */}
        {(myStream || remoteStream) && (
          <div
            className={`grid gap-4 animate-fadein ${
              myStream && remoteStream
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 max-w-2xl mx-auto'
            }`}
          >
            {myStream && (
              <div className="space-y-2">
                <VideoTile stream={myStream} label="You" muted mirrored />
              </div>
            )}
            {remoteStream && (
              <div className="space-y-2">
                <VideoTile stream={remoteStream} label="Remote" />
              </div>
            )}
          </div>
        )}

        {/* Peer joined but no stream yet */}
        {remoteSocketId && !myStream && (
          <div className="mt-4 flex justify-center animate-fadein">
            <div className="bg-cv-surface border border-white/[0.07] rounded-xl px-6 py-4 text-center max-w-sm">
              <p className="text-[12px] font-mono text-cv-muted">
                A peer has joined. Click{' '}
                <span className="text-cv-accent">Start Call</span> below to
                connect.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed controls */}
      <Controls
        hasStream={!!myStream}
        hasRemote={!!remoteSocketId}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onStartCall={startCall}
        onHangUp={handleHangUp}
      />
    </div>
  );
}
