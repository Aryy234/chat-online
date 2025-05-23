import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { v4 as uuidv4 } from 'uuid';
import './Lobby.css';

interface Room {
  id: string;
  name: string;
  userCount: number;
}

interface LobbyProps {
  onJoinRoom: (roomId: string, username: string, userId: string) => void;
}

function Lobby({ onJoinRoom }: LobbyProps) {
  const [username, setUsername] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [userId] = useState(() => localStorage.getItem('userId') || uuidv4());
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    // Guardar ID de usuario en localStorage
    localStorage.setItem('userId', userId);
    
    // Verificar si hay una sala pendiente a la que unirse (desde URL)
    const storedPendingRoomId = localStorage.getItem('pendingRoomId');
    if (storedPendingRoomId) {
      setPendingRoomId(storedPendingRoomId);
      setSelectedRoom(storedPendingRoomId);
      // Limpiar después de usar
      localStorage.removeItem('pendingRoomId');
    }
    
    // Obtener lista de salas disponibles
    const fetchRooms = () => {
      if (socket) {
        socket.emit('get_rooms', (rooms: Room[]) => {
          console.log('Salas disponibles:', rooms);
          setAvailableRooms(rooms);
          
          // Si tenemos un ID de sala pendiente, verificar si está en la lista
          if (pendingRoomId) {
            const roomExists = rooms.some(room => room.id === pendingRoomId);
            if (!roomExists) {
              console.log(`La sala ${pendingRoomId} no existe o fue eliminada`);
              setPendingRoomId(null);
            }
          }
        });
      }
    };

    // Cargar salas inicialmente y cada 5 segundos
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);

    return () => clearInterval(interval);
  }, [socket, userId, pendingRoomId]);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert('Por favor ingresa un nombre de usuario');
      return;
    }

    if (socket) {
      socket.emit('create_room', { username, userId }, (response: any) => {
        if (response.success) {
          console.log('Sala creada:', response);
          onJoinRoom(response.roomId, username, userId);
        } else {
          console.error('Error al crear sala:', response);
          alert(`Error al crear sala: ${response.message}`);
        }
      });
    }
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      alert('Por favor ingresa un nombre de usuario');
      return;
    }

    // Usar la sala seleccionada o la sala pendiente
    const roomIdToJoin = selectedRoom || pendingRoomId;
    
    if (!roomIdToJoin) {
      alert('Por favor selecciona una sala');
      return;
    }

    if (socket) {
      socket.emit('join_room', 
        { roomId: roomIdToJoin, username, userId }, 
        (response: any) => {
          if (response.success) {
            console.log('Unido a sala:', response);
            onJoinRoom(roomIdToJoin, username, userId);
          } else {
            console.error('Error al unirse a la sala:', response);
            alert(`Error al unirse a la sala: ${response.message}`);
          }
        }
      );
    }
  };

  return (
    <div className="lobby-container">
      <h1>Mecanography Game</h1>
      <div className="lobby-form">
        <div className="input-group">
          <label htmlFor="username">Nombre de Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu nombre"
          />
        </div>

        {pendingRoomId && (
          <div className="pending-invitation">
            <p>Tienes una invitación para unirte a una sala</p>
            <button 
              className="join-invitation-btn" 
              onClick={handleJoinRoom}
              disabled={!username.trim()}
            >
              Unirse a la sala
            </button>
          </div>
        )}

        {!pendingRoomId && (
          <div className="room-options">
            <button 
              className="create-room-btn" 
              onClick={handleCreateRoom}
              disabled={!username.trim()}
            >
              Crear Sala
            </button>
            
            <div className="vertical-divider">o</div>
            
            <div className="join-room-section">
              <div className="room-list">
                <h3>Salas Disponibles:</h3>
                {availableRooms.length === 0 ? (
                  <p className="no-rooms">No hay salas disponibles</p>
                ) : (
                  <ul>
                    {availableRooms.map((room) => (
                      <li 
                        key={room.id} 
                        className={selectedRoom === room.id ? 'selected' : ''}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        {room.name} ({room.userCount} usuario{room.userCount !== 1 ? 's' : ''})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button 
                className="join-room-btn" 
                onClick={handleJoinRoom} 
                disabled={!username.trim() || !selectedRoom}
              >
                Unirse a Sala
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;