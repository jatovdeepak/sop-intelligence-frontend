import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useStore from './useStore';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const useSocket = () => {
  // Grab the Zustand action to update health
  const updateServerHealth = useStore((state) => state.updateServerHealth);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    // Listen to the backend event and dump it directly into Zustand
    socket.on('server_status', (data) => {
      updateServerHealth(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [updateServerHealth]);
};