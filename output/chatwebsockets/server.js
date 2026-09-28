const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;
const history = [];
const connectedUsers = new Map();
const maxHistory = 100;

app.use(express.static(__dirname));

function currentUsers() {
  return [...connectedUsers.values()];
}

function publishUsers() {
  io.emit('presence', currentUsers());
}

function addToHistory(message) {
  history.push(message);
  if (history.length > maxHistory) {
    history.shift();
  }
}

io.on('connection', (socket) => {
  socket.emit('history', history);

  socket.on('join', (user) => {
    if (!user || typeof user.name !== 'string' || !user.name.trim()) {
      return;
    }

    const safeUser = {
      id: socket.id,
      name: user.name.trim().slice(0, 32),
      avatar: typeof user.avatar === 'string' ? user.avatar : ''
    };
    connectedUsers.set(socket.id, safeUser);
    socket.data.user = safeUser;
    publishUsers();
    socket.broadcast.emit('system-message', {
      id: `system-${Date.now()}-${socket.id}`,
      text: `${safeUser.name} joined the room`,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('chat-message', (payload) => {
    const user = socket.data.user;
    if (!user || !payload || typeof payload.text !== 'string' || !payload.text.trim()) {
      return;
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      type: 'text',
      text: payload.text.trim().slice(0, 2000),
      sender: user,
      timestamp: new Date().toISOString()
    };
    addToHistory(message);
    io.emit('chat-message', message);
  });

  socket.on('image-message', (payload) => {
    const user = socket.data.user;
    if (!user || !payload || typeof payload.url !== 'string' || !/^https?:\/\//i.test(payload.url)) {
      return;
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      type: 'image',
      url: payload.url.trim().slice(0, 2000),
      caption: typeof payload.caption === 'string' ? payload.caption.trim().slice(0, 240) : '',
      sender: user,
      timestamp: new Date().toISOString()
    };
    addToHistory(message);
    io.emit('chat-message', message);
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    if (user) {
      publishUsers();
      socket.broadcast.emit('system-message', {
        id: `system-${Date.now()}-${socket.id}`,
        text: `${user.name} left the room`,
        timestamp: new Date().toISOString()
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Chat server listening at http://localhost:${port}`);
});