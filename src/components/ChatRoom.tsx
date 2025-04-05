import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import './ChatRoom.css';
import { Message, User } from '../types';

interface ChatRoomProps {
  roomId: string;
  username: string;
  userId: string;
  onLeaveRoom: () => void;
}

function ChatRoom({ roomId, username, userId, onLeaveRoom }: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const { socket, users, messages } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Conectar directamente al socket para escuchar mensajes
  useEffect(() => {
    if (!socket) return;
    
    console.log("ChatRoom - Configurando listener para receive_message");
    
    // Handler para recibir mensajes
    const handleReceiveMessage = (message: Message) => {
      console.log("ChatRoom - Mensaje recibido directamente:", message);
      
      if (message.roomId === roomId) {
        console.log("ChatRoom - Mensaje para esta sala, añadiendo:", message);
        setLocalMessages(prev => {
          // Verificar si el mensaje ya existe
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };
    
    // Suscribirse al evento
    socket.on('receive_message', handleReceiveMessage);
    
    // Limpiar al desmontar
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, roomId]);

  // Combinar mensajes del contexto con los recibidos directamente
  useEffect(() => {
    console.log("ChatRoom - Actualizando mensajes locales desde contexto");
    
    // Filtrar mensajes para esta sala
    const filteredMessages = messages.filter(msg => msg.roomId === roomId);
    
    // Combinar mensajes del contexto con los recibidos directamente
    setLocalMessages(prevLocal => {
      // Crear un mapa de los mensajes existentes por ID
      const existingIds = new Map(prevLocal.map(msg => [msg.id, msg]));
      
      // Añadir mensajes del contexto que no estén ya en los locales
      for (const msg of filteredMessages) {
        if (!existingIds.has(msg.id)) {
          existingIds.set(msg.id, msg);
        }
      }
      
      return Array.from(existingIds.values());
    });
  }, [messages, roomId]);

  // Registramos cuando cambian usuarios o props para detectar problemas
  useEffect(() => {
    console.log("ChatRoom - usuarios actualizados:", users);
  }, [users]);

  // Hacer scroll hacia abajo cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages.length]);

  const formatTime = (timestamp: string | Date | undefined) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Función para enviar un mensaje de prueba
  const sendTestMessage = () => {
    if (socket) {
      const testMsg = {
        roomId,
        messageText: "Mensaje de prueba " + new Date().toLocaleTimeString(),
        userId,
        username
      };
      
      console.log("ChatRoom - Enviando mensaje de prueba:", testMsg);
      socket.emit('send_message', testMsg);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (socket) {
      console.log("ChatRoom - Enviando mensaje normal:", {
        roomId,
        messageText,
        userId,
        username
      });

      socket.emit('send_message', {
        roomId,
        messageText,
        userId,
        username
      });

      setMessageText('');
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', { roomId, userId, username }, (response: any) => {
        if (response.success) {
          onLeaveRoom();
        } else {
          console.error("Error al salir de la sala:", response.message);
        }
      });
    } else {
      onLeaveRoom();
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Sala: {roomId.substring(0, 8)}...</h2>
        <button className="leave-btn" onClick={handleLeaveRoom}>Salir</button>
      </div>

      <div className="chat-container">
        <div className="users-panel">
          <h3>Jugadores ({users.length})</h3>
          <ul>
            {users.map(user => (
              <li key={user.id} className={user.id === userId ? 'current-user' : ''}>
                {user.username} {user.id === userId ? '(Tú)' : ''}
              </li>
            ))}
          </ul>
          
          {/* Botón para enviar mensaje de prueba */}
          <button 
            className="test-btn"
            onClick={sendTestMessage}
            style={{ marginTop: '20px', padding: '5px' }}
          >
            Enviar Prueba
          </button>
        </div>

        <div className="messages-panel">
          <div className="messages-container">
            {localMessages.length === 0 ? (
              <div className="no-messages">No hay mensajes aún</div>
            ) : (
              localMessages.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  className={`message ${msg.userId === userId ? 'my-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span className="sender">{msg.userId === userId ? 'Tú' : msg.username}</span>
                    <span className="timestamp">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="message-content">{msg.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoFocus
            />
            <button type="submit" disabled={!messageText.trim()}>Enviar</button>
          </form>
        </div>
      </div>

      {/* Debug para ver los mensajes en formato JSON */}
      <div className="debug-info" style={{ fontSize: '10px', margin: '10px', color: '#999' }}>
        <div>Users: {users.length}</div>
        <div>Mensajes totales: {messages.length}</div>
        <div>Mensajes en esta sala: {localMessages.length}</div>
      </div>
    </div>
  );
}

export default ChatRoom; 