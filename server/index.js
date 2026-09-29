import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dgram from 'dgram';

const PORT = 3001;
const UDP_PORT = 8888;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// UDP Socket to receive real-time packets from ESP32 / Arduino on motorcycle
const udpSocket = dgram.createSocket('udp4');

udpSocket.on('listening', () => {
  const address = udpSocket.address();
  console.log(`[UDP Bridge Server] Listening for ESP32 packets on ${address.address}:${address.port}`);
});

udpSocket.on('message', (msg, rinfo) => {
  try {
    const rawData = msg.toString();
    console.log(`[UDP Packet from Bike ${rinfo.address}] ${rawData}`);

    // Forward telemetry over WebSockets to React Mobile App
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(rawData);
      }
    });
  } catch (err) {
    console.error('Error processing UDP packet:', err);
  }
});

udpSocket.bind(UDP_PORT);

// REST Endpoint to query server status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'RideSafe360',
    udpPort: UDP_PORT,
    activeConnections: wss.clients.size
  });
});

server.listen(PORT, () => {
  console.log(`[RideSafe360 Telemetry Bridge] Running at http://localhost:${PORT}`);
});
