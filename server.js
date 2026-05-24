const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', ({ roomName, password, username }) => {
    if (!roomName || !password || !username) {
      socket.emit('error', { message: 'Room name, password, and username are required' });
      return;
    }

    if (rooms.has(roomName)) {
      const room = rooms.get(roomName);
      if (room.password !== password) {
        socket.emit('error', { message: 'Incorrect password' });
        return;
      }
      room.users.set(socket.id, username);
    } else {
      rooms.set(roomName, {
        password,
        users: new Map([[socket.id, username]]),
        drawingData: []
      });
    }

    socket.join(roomName);
    socket.roomName = roomName;
    socket.username = username;

    const room = rooms.get(roomName);
    socket.emit('room-joined', {
      roomName,
      username,
      users: Array.from(room.users.values()),
      drawingData: room.drawingData
    });

    socket.to(roomName).emit('user-joined', {
      username,
      users: Array.from(room.users.values())
    });

    console.log(`${username} joined room: ${roomName}`);
  });

  socket.on('draw', (data) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      room.drawingData.push(data);
      socket.to(socket.roomName).emit('draw', data);
    }
  });

  socket.on('clear-canvas', () => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      room.drawingData = [];
      io.to(socket.roomName).emit('clear-canvas');
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomName) {
      const room = rooms.get(socket.roomName);
      if (room) {
        room.users.delete(socket.id);

        if (room.users.size === 0) {
          rooms.delete(socket.roomName);
          console.log(`Room ${socket.roomName} deleted (empty)`);
        } else {
          socket.to(socket.roomName).emit('user-left', {
            username: socket.username,
            users: Array.from(room.users.values())
          });
        }
      }
      console.log(`${socket.username} left room: ${socket.roomName}`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
