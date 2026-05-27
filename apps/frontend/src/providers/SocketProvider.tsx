'use client';
import { createContext, useContext } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const useSocketContext = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
