import { useState, useEffect } from 'react'
import './App.css'
import Lobby from './components/Lobby'
import ChatRoom from './components/ChatRoom'
import { SocketProvider, useSocket } from './context/SocketContext'

// Componente principal que utiliza el SocketProvider
function App() {
  const [inRoom, setInRoom] = useState(false)
  const [roomData, setRoomData] = useState({
    roomId: '',
    username: '',
    userId: ''
  })

  const handleJoinRoom = (roomId: string, username: string, userId: string) => {
    console.log("Unido a sala:", { roomId, username, userId })
    setRoomData({ roomId, username, userId })
    setInRoom(true)
  }

  const handleLeaveRoom = () => {
    setInRoom(false)
    setRoomData({ roomId: '', username: '', userId: '' })
  }

  return (
    <SocketProvider>
      <AppContent 
        inRoom={inRoom}
        roomData={roomData}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
      />
    </SocketProvider>
  )
}

// Componente interno que tiene acceso al contexto
function AppContent({ 
  inRoom, 
  roomData, 
  onJoinRoom, 
  onLeaveRoom 
}: { 
  inRoom: boolean; 
  roomData: { roomId: string; username: string; userId: string }; 
  onJoinRoom: (roomId: string, username: string, userId: string) => void;
  onLeaveRoom: () => void;
}) {
  const { users } = useSocket()
  
  // Log para debug
  useEffect(() => {
    console.log("Estado actual:", { inRoom, roomData, usersCount: users.length })
  }, [inRoom, roomData, users])

  return (
    <div className="app-container">
      {!inRoom ? (
        <Lobby onJoinRoom={onJoinRoom} />
      ) : (
        <ChatRoom 
          roomId={roomData.roomId}
          username={roomData.username}
          userId={roomData.userId}
          onLeaveRoom={onLeaveRoom}
        />
      )}
    </div>
  )
}

export default App
