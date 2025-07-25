import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./socket";

const httpServer = createServer();
const PORT = parseInt(process.env.PORT || "3001", 10);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "OPTIONS"], // Add OPTIONS for pre-flight requests
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false // Set to true if you need cookies/authentication
  },
  path: "/api/socket",
  transports: ["websocket", "polling"], // Allow both WebSocket and polling
  serveClient: false, // Don't serve the client files
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000 // Increase ping interval
});

// Handle pre-flight requests for all routes
httpServer.on("request", (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Length': 0
    });
    res.end();
    return;
  }
});

initializeSocket(io);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Handle server errors
httpServer.on("error", (error) => {
  console.error("Server error:", error);
});