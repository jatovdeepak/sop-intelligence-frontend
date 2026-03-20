import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// 1. Create the Context
const ServiceStatusContext = createContext(null);

// 2. Create a custom hook for easy access
export const useServiceStatus = () => useContext(ServiceStatusContext);

// 3. Create the Provider Component
export const ServiceStatusProvider = ({ children }) => {
  // Setup unified state structure for each service
  const [services, setServices] = useState({
    backend: { metrics: null, status: 'connecting' },
    rag: { metrics: null, status: 'connecting' },
    storage: { metrics: null, status: 'connecting' }
  });

  useEffect(() => {
    // Helper function to keep code DRY
    const setupSocket = (url, serviceKey) => {
      const socket = io(url, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000
      });

      const updateState = (updates) => {
        setServices(prev => ({
          ...prev,
          [serviceKey]: { ...prev[serviceKey], ...updates }
        }));
      };

      socket.on('connect', () => updateState({ status: 'online' }));
      
      socket.on('disconnect', () => updateState({ status: 'offline', metrics: null }));
      
      socket.on('connect_error', () => updateState({ status: 'reconnecting', metrics: null }));
      
      socket.on('server_status', (data) => updateState({ metrics: data }));

      return socket;
    };

    // Initialize all connections
    const backendSocket = setupSocket(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', 'backend');
    const ragSocket = setupSocket(import.meta.env.VITE_RAG_API_BASE_URL || 'http://localhost:8000', 'rag');
    const storageSocket = setupSocket(import.meta.env.VITE_STORAGE_API_BASE_URL || 'http://localhost:5001', 'storage');

    // Cleanup on unmount
    return () => {
      backendSocket.disconnect();
      ragSocket.disconnect();
      storageSocket.disconnect();
    };
  }, []);

  return (
    <ServiceStatusContext.Provider value={services}>
      {children}
    </ServiceStatusContext.Provider>
  );
};