'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const RECONNECTION_DELAY_MS = 1000;
const RECONNECTION_ATTEMPTS = 30;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: RECONNECTION_DELAY_MS,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
    });
  }
  return socket;
}
