import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);

app.use(cors());

interface User {
  id: string;
  username: string;
}

interface Room {
  id: string;
  name: string;
  createdBy: string;
  users: User[];
}

interface Message {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: string;
}

const rooms: Record<string, Room> = {};
const socketToUserMap: Record<string, { userId: string; username: string; roomId: string | null }> = {};

const io = new SocketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userData = socketToUserMap[socket.id];
    if (userData && userData.roomId) {
      const { roomId, userId, username } = userData;
      
      if (rooms[roomId]) {
        rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== userId);
        console.log(`User ${username} removed from room ${roomId}`);
        
        // Notificar a todos en la sala (incluido el que se desconecta) que el usuario se fue
        io.in(roomId).emit('user_left', { userId, username });
        
        // Actualizar la lista de usuarios para todos
        io.in(roomId).emit('update_users', rooms[roomId].users);
        
        // Si la sala quedó vacía, eliminarla
        if (rooms[roomId].users.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted because it's empty`);
        }
      }
    }
    
    // Eliminar la asociación de socket a usuario
    delete socketToUserMap[socket.id];
  });

  socket.on('create_room', ({ username, userId }, callback) => {
    console.log(`User ${username} (${userId}) wants to create a room`);
    
    // Verificar si el usuario ya tiene una sala
    for (const roomId in rooms) {
      const createdByThisUser = rooms[roomId].createdBy === userId;
      if (createdByThisUser) {
        console.log(`User ${username} already created room ${roomId}`);
        
        // Si el usuario ya está en esta sala, simplemente devolver la info
        if (rooms[roomId].users.some(user => user.id === userId)) {
          socketToUserMap[socket.id] = { userId, username, roomId };
          socket.join(roomId);
          callback({ 
            success: true, 
            roomId, 
            message: 'Reconnected to your existing room' 
          });
          return;
        }
        
        // Si el usuario creó la sala pero no está en ella, añadirlo
        rooms[roomId].users.push({ id: userId, username });
        socketToUserMap[socket.id] = { userId, username, roomId };
        socket.join(roomId);
        
        // Notificar a todos en la sala que el usuario se unió
        io.in(roomId).emit('user_joined', { userId, username });
        io.in(roomId).emit('update_users', rooms[roomId].users);
        
        callback({ 
          success: true, 
          roomId, 
          message: 'Reconnected to your existing room' 
        });
        return;
      }
    }
    
    // Si el usuario no tiene una sala, crear una nueva
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name: `${username}'s room`,
      createdBy: userId,
      users: [{ id: userId, username }],
    };
    
    rooms[roomId] = room;
    socketToUserMap[socket.id] = { userId, username, roomId };
    
    socket.join(roomId);
    console.log(`Room ${roomId} created by ${username}`);
    
    // Actualizar la lista de usuarios
    io.in(roomId).emit('update_users', room.users);
    
    callback({ 
      success: true, 
      roomId, 
      message: 'Room created successfully' 
    });
  });

  socket.on('join_room', ({ roomId, username, userId }, callback) => {
    console.log(`User ${username} (${userId}) wants to join room ${roomId}`);
    
    // Verificar si la sala existe
    if (!rooms[roomId]) {
      console.log(`Room ${roomId} does not exist`);
      callback({ 
        success: false, 
        message: 'Room does not exist' 
      });
      return;
    }
    
    // Verificar si el usuario ya está en alguna sala
    const oldRoomId = socketToUserMap[socket.id]?.roomId;
    if (oldRoomId) {
      // Si el usuario ya está en esta misma sala
      if (oldRoomId === roomId) {
        callback({ 
          success: true, 
          message: 'Already in this room' 
        });
        return;
      }
      
      // Si está en otra sala, sacarlo primero
      if (rooms[oldRoomId]) {
        rooms[oldRoomId].users = rooms[oldRoomId].users.filter(user => user.id !== userId);
        socket.leave(oldRoomId);
        
        // Notificar a todos en la sala anterior que el usuario se fue
        io.in(oldRoomId).emit('user_left', { userId, username });
        io.in(oldRoomId).emit('update_users', rooms[oldRoomId].users);
        
        // Si la sala quedó vacía, eliminarla
        if (rooms[oldRoomId].users.length === 0) {
          delete rooms[oldRoomId];
          console.log(`Room ${oldRoomId} deleted because it's empty`);
        }
      }
    }
    
    // Añadir usuario a la nueva sala
    const userExists = rooms[roomId].users.some(user => user.id === userId);
    if (!userExists) {
      rooms[roomId].users.push({ id: userId, username });
    }
    
    socketToUserMap[socket.id] = { userId, username, roomId };
    socket.join(roomId);
    
    // Notificar a todos en la sala (incluido el que se une) que el usuario se unió
    io.in(roomId).emit('user_joined', { userId, username });
    
    // Enviar lista actualizada de usuarios a todos en la sala
    io.in(roomId).emit('update_users', rooms[roomId].users);
    
    console.log(`User ${username} joined room ${roomId}`);
    console.log(`Room ${roomId} now has users:`, rooms[roomId].users);
    
    callback({ 
      success: true, 
      message: 'Joined room successfully' 
    });
  });

  socket.on('send_message', ({ roomId, messageText, userId, username }) => {
    console.log(`Message from ${username} in room ${roomId}: ${messageText}`);
    
    if (!rooms[roomId]) {
      console.error(`Room ${roomId} does not exist for message`);
      return;
    }
    
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Crear mensaje con el formato correcto
    const message: Message = {
      id: messageId,
      text: messageText,
      userId,
      username,
      roomId,
      timestamp
    };
    
    // Emitir el mensaje a todos en la sala (incluido el remitente)
    io.in(roomId).emit('receive_message', message);
    
    // Para debugging, imprimimos el mensaje completo
    console.log('Mensaje enviado a clientes:', JSON.stringify(message));
  });

  socket.on('leave_room', ({ roomId, userId, username }, callback) => {
    console.log(`User ${username} is leaving room ${roomId}`);
    
    if (rooms[roomId]) {
      // Remover al usuario de la sala
      rooms[roomId].users = rooms[roomId].users.filter(user => user.id !== userId);
      
      // Salir de la sala en Socket.IO
      socket.leave(roomId);
      
      // Actualizar el mapeo de socket a usuario
      if (socketToUserMap[socket.id]) {
        socketToUserMap[socket.id].roomId = null;
      }
      
      // Notificar a todos que el usuario se fue
      io.in(roomId).emit('user_left', { userId, username });
      io.in(roomId).emit('update_users', rooms[roomId].users);
      
      // Si la sala quedó vacía, eliminarla
      if (rooms[roomId].users.length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted because it's empty`);
      }
      
      callback({ success: true, message: 'Left room successfully' });
    } else {
      callback({ success: false, message: 'Room does not exist' });
    }
  });

  socket.on('get_rooms', (callback) => {
    const roomList = Object.values(rooms).map(room => ({
      id: room.id,
      name: room.name,
      userCount: room.users.length
    }));
    
    callback(roomList);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 