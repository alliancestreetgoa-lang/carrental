'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocketContext = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // Hold the socket in state (not a ref) so consumers re-render and
  // re-subscribe once the connection is established.
  const [socket, setSocket] = useState<Socket | null>(null);

  // Canonical effect-based setup: create the socket on mount, expose it via
  // state so consumers re-render once connected, and disconnect on unmount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
