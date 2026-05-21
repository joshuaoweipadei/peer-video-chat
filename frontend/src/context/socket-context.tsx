'use client';

import { createContext, useMemo, useContext, type ReactNode } from 'react';
import { type Socket, io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = (): Socket => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error('useSocket must be used inside <SocketProvider>');
  }
  return socket;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socket = useMemo(
    () =>
      io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }),
    [],
  );

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
