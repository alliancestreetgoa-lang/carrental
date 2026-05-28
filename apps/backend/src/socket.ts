import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export type RealtimeEvent =
  | 'booking:created'
  | 'booking:updated'
  | 'booking:cancelled'
  | 'car:changed'
  | 'payment:added';

export const emitRealtime = (event: RealtimeEvent, payload: Record<string, unknown> = {}) => {
  io?.emit(event, payload);
};
