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

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

function ChatRoom({ roomId, username, userId, onLeaveRoom }: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const { socket, users, messages } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimerRef = useRef<number | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    console.log("ChatRoom - Configurando listener para receive_message");
    
    const handleReceiveMessage = (message: Message) => {
      console.log("ChatRoom - Mensaje recibido directamente:", message);
      
      if (message.roomId === roomId) {
        console.log("ChatRoom - Mensaje para esta sala, añadiendo:", message);
        setLocalMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };
    
    const handleTypingUpdate = (users: TypingUser[]) => {
      console.log("ChatRoom - Actualizando usuarios escribiendo:", users);
      const filteredUsers = users.filter(user => user.userId !== userId);
      setTypingUsers(filteredUsers);
    };
    
    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_update', handleTypingUpdate);
    
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_update', handleTypingUpdate);
      
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [socket, roomId, userId]);

  useEffect(() => {
    console.log("ChatRoom - Actualizando mensajes locales desde contexto");
    
    const filteredMessages = messages.filter(msg => msg.roomId === roomId);
    
    setLocalMessages(prevLocal => {
      const existingIds = new Map(prevLocal.map(msg => [msg.id, msg]));
      
      for (const msg of filteredMessages) {
        if (!existingIds.has(msg.id)) {
          existingIds.set(msg.id, msg);
        }
      }
      
      return Array.from(existingIds.values());
    });
  }, [messages, roomId]);

  useEffect(() => {
    console.log("ChatRoom - usuarios actualizados:", users);
  }, [users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages.length]);

  const formatTime = (timestamp: string | Date | undefined) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMessageText(text);
    
    if (!socket) return;
    
    const isTyping = text.length > 0;
    
    socket.emit('typing', { roomId, userId, username, isTyping });
    
    if (typingTimerRef.current !== null) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    if (!isTyping) return;
    
    typingTimerRef.current = window.setTimeout(() => {
      socket.emit('typing', { roomId, userId, username, isTyping: false });
      typingTimerRef.current = null;
    }, 3000);
  };

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
      
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      
      socket.emit('typing', { roomId, userId, username, isTyping: false });
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

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    let typingMessage = '';
    if (typingUsers.length === 1) {
      typingMessage = `${typingUsers[0].username} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      typingMessage = `${typingUsers[0].username} y ${typingUsers[1].username} están escribiendo...`;
    } else {
      typingMessage = `${typingUsers.length} personas están escribiendo...`;
    }
    
    return (
      <div className="typing-indicator">
        {typingMessage}
      </div>
    );
  };

  const copyInviteLink = () => {
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}?room=${roomId}`;
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 3000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles:', err);
        alert('No se pudo copiar el enlace automáticamente. El enlace es: ' + inviteLink);
      });
  };
  
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 3000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles:', err);
        alert('No se pudo copiar el código automáticamente. El código es: ' + roomId);
      });
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <h2>Sala: {roomId.substring(0, 8)}...</h2>
        <div className="room-actions">
          <button className="copy-link-btn" onClick={copyInviteLink}>
            Copiar enlace de invitación
          </button>
          <button className="copy-code-btn" onClick={copyRoomCode}>
            Copiar código
          </button>
          <button className="leave-btn" onClick={handleLeaveRoom}>
            Salir
          </button>
          {showCopied && <div className="copy-confirmation">¡Copiado al portapapeles!</div>}
        </div>
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

          {renderTypingIndicator()}

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={messageText}
              onChange={handleMessageInputChange}
              placeholder="Escribe un mensaje..."
              autoFocus
            />
            <button type="submit" disabled={!messageText.trim()}>Enviar</button>
          </form>
        </div>
      </div>

      <div className="debug-info" style={{ fontSize: '10px', margin: '10px', color: '#999' }}>
        <div>Users: {users.length}</div>
        <div>Mensajes totales: {messages.length}</div>
        <div>Mensajes en esta sala: {localMessages.length}</div>
        <div>Usuarios escribiendo: {typingUsers.length}</div>
      </div>
    </div>
  );
}

export default ChatRoom;