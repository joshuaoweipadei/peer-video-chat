import type { JoinRoomPayload } from '@/types.ts';
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/context/socket-context.tsx';

const Lobby = () => {
  const navigate = useNavigate();
  const socket = useSocket();

  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState({
    email: '',
    room: '',
  });

  const generate = (): void => {
    setRoom(Math.random().toString(36).slice(2, 10).toUpperCase());
    setError({ email: '', room: '' });
  };

  const handleSubmitForm = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError({ email: '', room: '' });

    if (!email.trim()) {
      setError({ ...error, email: 'Email is required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError({ ...error, email: 'Enter a valid email.' });
      return;
    }
    if (!room.trim()) {
      setError({ ...error, room: 'Room ID is required.' });
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(room)) {
      setError({
        ...error,
        room: '3–32 chars — letters, numbers, - or _ only.',
      });

      return;
    }

    socket.emit('join-room', { email: email.trim(), room: room.trim() });
  };

  const handleJoinRoom = useCallback(
    ({ room }: JoinRoomPayload) => {
      navigate(`/room/${encodeURIComponent(room)}`);
    },
    [navigate],
  );

  useEffect(() => {
    socket.on('join-room', handleJoinRoom);
    return () => {
      socket.off('join-room', handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <main className="min-h-screen bg-cv-bg flex items-center justify-center px-4">
      {/* Background grid texture */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(0,229,160,1) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(0,229,160,1) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md animate-fadein">
        <div className="bg-cv-surface border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <header className="bg-cv-card px-8 pt-8 pb-6 text-center border-b border-white/[0.07]">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cv-accent/10 border border-cv-accent/30 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-cv-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-cv-text tracking-tight">
              Peer<span className="text-cv-accent">Chat</span>
            </h1>
            <p className="text-[12px] text-cv-muted mt-1 font-mono">
              Video calling · Peer-to-peer · WebRTC
            </p>
          </header>

          {/* Form */}
          <div className="px-8 py-7">
            <form
              onSubmit={handleSubmitForm}
              noValidate
              aria-label="Join a video room"
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] text-cv-muted uppercase tracking-widest mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="josh@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    setError({ ...error, email: '' });
                  }}
                  spellCheck={false}
                  aria-describedby={error.email ? 'email-error' : undefined}
                  aria-invalid={error.email ? true : undefined}
                  className={`w-full bg-cv-card text-cv-text placeholder-cv-muted rounded-lg
                  px-4 py-3 text-[13px] font-mono border border-white/[0.07] transition-all outline-none
                  focus:ring-2 focus:ring-cv-accent
                  ${
                    error.email
                      ? 'border-cv-danger ring-1 ring-cv-danger'
                      : 'border-white/[0.07]'
                  }`}
                />
                {error.email && (
                  <p
                    id="enail-eror"
                    role="alert"
                    className="mt-2 text-[11px] text-cv-danger font-mono"
                  >
                    {error.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="room-id"
                  className="block text-[11px] text-cv-muted uppercase tracking-widest mb-2"
                >
                  Room ID
                </label>
                <input
                  id="room-id"
                  type="text"
                  value={room}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRoom(e.target.value);
                    setError({ ...error, room: '' });
                  }}
                  placeholder="Enter or generate a room ID"
                  maxLength={32}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={error.room ? 'room-error' : undefined}
                  aria-invalid={!!error.room}
                  className={`w-full bg-cv-card text-cv-text placeholder-cv-muted rounded-lg
                  px-4 py-3 text-[13px] font-mono border transition-all outline-none
                  focus:ring-2 focus:ring-cv-accent
                  ${
                    error.room
                      ? 'border-cv-danger ring-1 ring-cv-danger'
                      : 'border-white/[0.07]'
                  }`}
                />
                {error.room && (
                  <p
                    id="room-eror"
                    role="alert"
                    className="mt-2 text-[11px] text-cv-danger font-mono"
                  >
                    {error.room}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={generate}
                className="w-full mt-4 py-2.5 text-[12px] font-mono text-cv-accent
                  border border-cv-accent/30 rounded-lg hover:bg-cv-accent/10
                  transition-colors focus:outline-none focus:ring-2 focus:ring-cv-accent"
              >
                Generate Random Room ID
              </button>

              <button
                type="submit"
                className="w-full mt-3 py-3 bg-cv-accent hover:opacity-90 active:scale-[0.98]
                  text-cv-bg font-display font-bold text-[14px] rounded-lg transition-all
                  focus:outline-none focus:ring-2 focus:ring-cv-accent
                  focus:ring-offset-2 focus:ring-offset-cv-surface"
              >
                Join Room →
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] text-cv-muted font-mono">
              Both peers open the same room ID to connect
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {(
            ['WebRTC P2P', 'Canvas Overlay', 'Tracking IDs', '30fps'] as const
          ).map((f) => (
            <span
              key={f}
              className="text-[10px] font-mono text-cv-muted border border-white/[0.07] rounded-full px-3 py-1"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
};
export default Lobby;
