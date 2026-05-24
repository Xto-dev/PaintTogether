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
const userCursors = new Map();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
      const defaultLayer = {
        id: generateId(),
        name: 'Layer 1',
        visible: true,
        opacity: 1.0,
        drawingData: []
      };
      rooms.set(roomName, {
        password,
        users: new Map([[socket.id, username]]),
        layers: [defaultLayer]
      });
    }

    socket.join(roomName);
    socket.roomName = roomName;
    socket.username = username;

    const room = rooms.get(roomName);

    const existingCursors = [];
    room.users.forEach((user, sid) => {
      if (sid !== socket.id && userCursors.has(sid)) {
        const cursorData = userCursors.get(sid);
        existingCursors.push({
          socketId: sid,
          username: user,
          ...cursorData
        });
      }
    });

    socket.emit('room-joined', {
      roomName,
      username,
      users: Array.from(room.users.values()),
      layers: room.layers,
      cursors: existingCursors
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
      const layer = room.layers.find(l => l.id === data.layerId);
      if (layer) {
        layer.drawingData.push(data);
        socket.to(socket.roomName).emit('draw', data);
      }
    }
  });

  socket.on('draw-batch', (batch) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      batch.forEach(data => {
        const layer = room.layers.find(l => l.id === data.layerId);
        if (layer) {
          layer.drawingData.push(data);
        }
      });
      socket.to(socket.roomName).emit('draw-batch', batch);
    }
  });

  socket.on('clear-canvas', () => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      room.layers.forEach(layer => {
        layer.drawingData = [];
      });
      io.to(socket.roomName).emit('clear-canvas');
    }
  });

  socket.on('add-layer', () => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      const newLayer = {
        id: generateId(),
        name: `Layer ${room.layers.length + 1}`,
        visible: true,
        opacity: 1.0,
        drawingData: []
      };
      room.layers.push(newLayer);
      io.to(socket.roomName).emit('layer-added', newLayer);
    }
  });

  socket.on('delete-layer', ({ layerId }) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room && room.layers.length > 1) {
      room.layers = room.layers.filter(l => l.id !== layerId);
      io.to(socket.roomName).emit('layer-deleted', { layerId });
    }
  });

  socket.on('update-layer', ({ layerId, updates }) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      const layer = room.layers.find(l => l.id === layerId);
      if (layer) {
        Object.assign(layer, updates);
        io.to(socket.roomName).emit('layer-updated', { layerId, updates });
      }
    }
  });

  socket.on('reorder-layers', ({ layers: layerIds }) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      const reorderedLayers = [];
      layerIds.forEach(id => {
        const layer = room.layers.find(l => l.id === id);
        if (layer) {
          reorderedLayers.push(layer);
        }
      });
      room.layers = reorderedLayers;
      socket.to(socket.roomName).emit('layers-reordered', { layers: layerIds });
    }
  });

  socket.on('cursor-move', (data) => {
    if (!socket.roomName) return;

    userCursors.set(socket.id, data);

    socket.to(socket.roomName).emit('cursor-move', {
      socketId: socket.id,
      username: socket.username,
      ...data
    });
  });

  socket.on('undo', ({ layerId, drawingData }) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      const layer = room.layers.find(l => l.id === layerId);
      if (layer) {
        layer.drawingData = drawingData;
        socket.to(socket.roomName).emit('undo', { layerId, drawingData });
      }
    }
  });

  socket.on('redo', ({ layerId, drawingData }) => {
    if (!socket.roomName) return;

    const room = rooms.get(socket.roomName);
    if (room) {
      const layer = room.layers.find(l => l.id === layerId);
      if (layer) {
        layer.drawingData = drawingData;
        socket.to(socket.roomName).emit('redo', { layerId, drawingData });
      }
    }
  });

  socket.on('disconnect', () => {
    userCursors.delete(socket.id);

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
            socketId: socket.id,
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
