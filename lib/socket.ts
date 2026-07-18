'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      autoConnect: false,
    });
  }
  return socket;
}
