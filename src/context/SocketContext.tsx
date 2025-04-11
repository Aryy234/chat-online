import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '../types';

// Obtener la URL del servidor Socket.IO desde las variables de entorno
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

// Crear una única instancia del socket fuera del componente
const socket = io(SOCKET_URL);

interface SocketContextType {
  socket: Socket;
  users: User[];
  messages: Message[];
  connected: boolean;
  currentRoomId: string | null;
  setCurrentRoomId: (roomId: string | null) => void;
}

const initialState: SocketContextType = {
  socket,
  users: [],
  messages: [],
  connected: false,
  currentRoomId: null,
  setCurrentRoomId: () => {}
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
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Función para actualizar la lista de usuarios
  const updateUsers = useCallback((newUsers: User[]) => {
    console.log("SocketContext - Actualizando usuarios:", newUsers);
    // Asegurarnos de que tenemos una lista válida antes de actualizar
    if (Array.isArray(newUsers) && newUsers.length > 0) {
      setUsers(newUsers);
    } else {
      console.warn("SocketContext - Recibida lista de usuarios vacía o inválida:", newUsers);
    }
  }, []);

  // Configurar los eventos básicos del socket
  useEffect(() => {
    console.log("SocketContext - Inicializando socket, roomId:", currentRoomId);
    
    // No eliminar todos los eventos para evitar problemas con 'receive_message'
    // socket.removeAllListeners();

    // Evento de conexión
    socket.on('connect', () => {
      console.log("SocketContext - Conectado al servidor:", socket.id);
      setConnected(true);
      
      // Si ya tenemos un ID de sala, solicitar la lista de usuarios
      if (currentRoomId) {
        console.log("SocketContext - Solicitando usuarios para sala existente:", currentRoomId);
        socket.emit('get_room_users', { roomId: currentRoomId }, (response: any) => {
          console.log("SocketContext - Respuesta get_room_users:", response);
          if (response.success && response.users) {
            updateUsers(response.users);
          }
        });
      }
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
      console.log("SocketContext - Desconectado del servidor");
      setConnected(false);
    });

    // Actualizar usuarios cuando se recibe la lista completa
    socket.on('update_users', (userList: User[]) => {
      console.log("SocketContext - Lista de usuarios actualizada:", userList);
      updateUsers(userList);
    });

    // Cuando un usuario se une a una sala
    socket.on('user_joined', (userData: {userId: string, username: string}) => {
      console.log("SocketContext - Usuario se unió:", userData);
      // Solicitar la lista actualizada de usuarios
      if (currentRoomId) {
        socket.emit('get_room_users', { roomId: currentRoomId });
      }
    });

    // Cuando un usuario abandona una sala
    socket.on('user_left', (userData: {userId: string, username: string}) => {
      console.log("SocketContext - Usuario abandonó la sala:", userData);
      // Aquí no hacemos nada porque el servidor enviará update_users
    });

    // Verificar si ya estamos conectados
    if (socket.connected) {
      console.log("SocketContext - Socket ya conectado:", socket.id);
      setConnected(true);
      
      // Solicitar usuarios si ya estamos en una sala
      if (currentRoomId) {
        socket.emit('get_room_users', { roomId: currentRoomId });
      }
    }

    return () => {
      console.log("SocketContext - Limpiando listeners básicos");
      socket.off('connect');
      socket.off('disconnect');
      socket.off('update_users');
      socket.off('user_joined');
      socket.off('user_left');
    };
  }, [updateUsers, currentRoomId]);

  // Efecto separado para manejar mensajes recibidos
  useEffect(() => {
    if (!socket) return;
    
    console.log("SocketContext - Configurando manejador de mensajes");
    
    const handleReceiveMessage = (message: Message) => {
      console.log("SocketContext - Mensaje recibido:", message);
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };
    
    // Quitar manejadores antiguos para evitar duplicados
    socket.off('receive_message');
    
    // Agregar nuevo manejador
    socket.on('receive_message', handleReceiveMessage);
    
    return () => {
      console.log("SocketContext - Limpiando manejador de mensajes");
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]); // Solo depende del socket, no del currentRoomId

  const contextValue = {
    socket,
    users,
    messages,
    connected,
    currentRoomId,
    setCurrentRoomId
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};