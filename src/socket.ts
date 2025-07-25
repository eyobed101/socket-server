import { Server, Socket } from "socket.io";

interface Room {
  participants: Set<string>;
  canvasState: string | null;
}

const rooms = new Map<string, Room>();

export function initializeSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const roomId = socket.handshake.query.roomId as string;

    if (!roomId) {
      socket.disconnect();
      return;
    }

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Set(),
        canvasState: null
      });
    }

    const room = rooms.get(roomId)!;
    room.participants.add(socket.id);
    socket.join(roomId);

    // Notify all clients in the room (including the new one)
    io.to(roomId).emit("participants-update", room.participants.size);
    console.log(`Room ${roomId} now has ${room.participants.size} participants`);

    // Send current canvas state to new participant
    if (room.canvasState) {
      socket.emit("canvas-state", room.canvasState);
    }

    setupSocketHandlers(socket, roomId);
  });
}

function setupSocketHandlers(socket: Socket, roomId: string) {
  const room = rooms.get(roomId)!;

  socket.on("drawing-data", (data) => {
    socket.to(roomId).emit("drawing-data", data);
  });

  socket.on('request-canvas-state', () => {
    if (room.canvasState) {
      socket.emit('canvas-state', room.canvasState);
    }
  });

  socket.on("canvas-state", (state: string) => {
    room.canvasState = state;
    socket.to(roomId).emit("canvas-state", state);
  });

  socket.on("clear-canvas", () => {
    room.canvasState = null;
    socket.to(roomId).emit("clear-canvas");
  });

  socket.on("disconnect", () => {
    if (rooms.has(roomId)) {
      room.participants.delete(socket.id);
      socket.to(roomId).emit("participants-update", room.participants.size);

      if (room.participants.size === 0) {
        rooms.delete(roomId);
      }
    }
  });
}