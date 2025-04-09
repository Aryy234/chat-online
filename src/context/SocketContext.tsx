import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '../types';

// Obtener la URL del servidor Socket.IO desde las variables de entorno
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Crear una única instancia del socket fuera del componente
const socket = io(SOCKET_URL);

interface SocketContextType {
  socket: Socket;
  users: User[];
  messages: Message[];
  connected: boolean;
}

const initialState: SocketContextType = {
  socket,
  users: [],
  messages: [],
  connected: false
};

const SocketContext = createContext<SocketContextType>(initialState);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);

  // Función para actualizar la lista de usuarios
  const updateUsers = useCallback((newUsers: User[]) => {
    console.log("Actualizando usuarios:", newUsers);
    setUsers(newUsers);
  }, []);

  useEffect(() => {
    console.log("SocketContext - Inicializando socket");

    // Limpiar listeners antiguos
    socket.removeAllListeners();

    // Evento de conexión
    socket.on('connect', () => {
      console.log("Conectado al servidor:", socket.id);
      setConnected(true);
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
      console.log("Desconectado del servidor");
      setConnected(false);
    });

    // Actualizar usuarios
    socket.on('update_users', (userList: User[]) => {
      console.log("Lista de usuarios actualizada:", userList);
      updateUsers(userList);
    });

    // Verificar si ya estamos conectados
    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('update_users');
    };
  }, [updateUsers]);

  const contextValue = {
    socket,
    users,
    messages,
    connected
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};