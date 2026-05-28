'use client';
import { useEffect, useRef } from 'react';
import { useSocketContext } from '@/providers/SocketProvider';

/**
 * Subscribe to a set of Socket.IO events and run a handler when any fires.
 * The handler is kept in a ref so callers don't need to memoize it, and
 * subscriptions are re-bound only when the socket or the event set changes.
 */
export function useRealtime(events: string[], handler: () => void) {
  const socket = useSocketContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const key = events.join(',');

  useEffect(() => {
    if (!socket) return;
    const fn = () => handlerRef.current();
    const list = key ? key.split(',') : [];
    list.forEach((e) => socket.on(e, fn));
    return () => list.forEach((e) => socket.off(e, fn));
  }, [socket, key]);
}

export const BOOKING_EVENTS = ['booking:created', 'booking:updated', 'booking:cancelled'];
export const CAR_EVENTS = ['car:changed'];
export const PAYMENT_EVENTS = ['payment:added'];
