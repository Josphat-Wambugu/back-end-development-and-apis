import http from 'http';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3001;

// 1. Create HTTP server reading ./public/index.html
const server = http.createServer((req, res) => {
  fs.readFile('./public/index.html', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// 2. Create WebSocketServer attached to the HTTP server instance
const wss = new WebSocketServer({ server });

// Helper function to broadcast JSON messages to clients
const broadcast = (data) => {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
};

// 3. Register 'connection' listener on wss
wss.on('connection', (socket, req) => {
  // 4. Parse username from query parameters
  const username = new URL(req.url, 'http://localhost').searchParams.get('username');

  // Immediately broadcast system join message
  broadcast({
    type: 'system',
    text: `${username} joined`
  });

  // 5. Register 'message' listener on socket
  socket.on('message', (messageData) => {
    try {
      const parsedMessage = JSON.parse(messageData.toString());
      const { username: msgUsername, text } = parsedMessage;

      // Broadcast chat message to all clients
      broadcast({
        type: 'chat',
        username: msgUsername,
        text: text
      });
    } catch (err) {
      console.error('Invalid JSON received:', err);
    }
  });

  // 6. Register 'close' listener on socket
  socket.on('close', () => {
    broadcast({
      type: 'system',
      text: `${username} left`
    });
  });
});

// 7. Start server listening on PORT
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:3001`);
});