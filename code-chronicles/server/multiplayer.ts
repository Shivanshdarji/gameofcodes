import { Server } from 'socket.io';
import { createServer } from 'http';

// Types
interface Player {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  rotation: number;
  isReady: boolean;
  isEliminated: boolean;
  submittedCode: any[] | null;
  distanceToSatellite: number;
}

interface GameRoom {
  id: string;
  players: Map<string, Player>;
  gamePhase: 'lobby' | 'coding' | 'executing' | 'finished';
  currentRound: number;
  currentTurnIndex: number;
  satellitePosition: [number, number, number];
  codingTimer: number;
  winner: string | null;
  hostId: string;
}

const PORT = 3001;
const rooms = new Map<string, GameRoom>();

// Player colors for visual distinction
const PLAYER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
  '#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e',
  '#e17055', '#74b9ff'
];

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function randomSatellitePosition(level: number = 1): [number, number, number] {
  const angle = Math.random() * Math.PI * 2;
  // Increase distance based on level
  const baseDistance = 50;
  const levelBonus = (level - 1) * 20; // +20 units per level
  const dist = baseDistance + levelBonus + Math.random() * 30;
  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;
  return [x, 5, z];
}

// Create HTTP server
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create or join room
  socket.on('create-room', (playerName: string, callback) => {
    const roomId = generateRoomId();
    const player: Player = {
      id: socket.id,
      name: playerName,
      color: PLAYER_COLORS[0],
      position: [0, 0, 0],
      rotation: Math.PI,
      isReady: false,
      isEliminated: false,
      submittedCode: null,
      distanceToSatellite: 0
    };

    const room: GameRoom = {
      id: roomId,
      players: new Map([[socket.id, player]]),
      gamePhase: 'lobby',
      currentRound: 0,
      currentTurnIndex: 0,
      satellitePosition: randomSatellitePosition(),
      codingTimer: 30,
      winner: null,
      hostId: socket.id
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    callback({ success: true, roomId, player });
    console.log(`Room created: ${roomId} by ${playerName}`);
  });

  socket.on('join-room', (roomId: string, playerName: string, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.players.size >= 10) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    if (room.gamePhase !== 'lobby') {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      color: PLAYER_COLORS[room.players.size],
      position: [0, 0, 0],
      rotation: Math.PI,
      isReady: false,
      isEliminated: false,
      submittedCode: null,
      distanceToSatellite: 0
    };

    room.players.set(socket.id, player);
    socket.join(roomId);

    callback({ success: true, roomId, player });

    // Broadcast updated player list
    io.to(roomId).emit('player-joined', {
      players: Array.from(room.players.values()),
      newPlayer: player
    });

    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on('toggle-ready', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.isReady = !player.isReady;

    io.to(roomId).emit('player-ready-changed', {
      playerId: socket.id,
      isReady: player.isReady,
      players: Array.from(room.players.values())
    });
  });

  socket.on('start-match', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room || socket.id !== room.hostId) return;

    const readyPlayers = Array.from(room.players.values()).filter(p => p.isReady);
    if (readyPlayers.length < 2) {
      socket.emit('error', 'Need at least 2 ready players to start');
      return;
    }

    room.gamePhase = 'coding';
    room.currentRound = 1;
    room.codingTimer = 30;
    // Generate satellite position based on level
    room.satellitePosition = randomSatellitePosition(room.currentRound);

    io.to(roomId).emit('match-started', {
      gamePhase: room.gamePhase,
      satellitePosition: room.satellitePosition,
      currentRound: room.currentRound
    });

    // Start coding timer
    startCodingTimer(roomId);
  });

  socket.on('submit-code', (roomId: string, commands: any[]) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || player.isEliminated) return;

    player.submittedCode = commands;

    io.to(roomId).emit('code-submitted', {
      playerId: socket.id,
      playerName: player.name
    });

    // Check if all active players submitted
    const activePlayers = Array.from(room.players.values()).filter(p => !p.isEliminated && p.isReady);
    const allSubmitted = activePlayers.every(p => p.submittedCode !== null);

    if (allSubmitted) {
      startExecution(roomId);
    }
  });

  socket.on('update-position', (roomId: string, position: [number, number, number], rotation: number) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.position = position;
    player.rotation = rotation;

    // Calculate distance to satellite
    const dx = position[0] - room.satellitePosition[0];
    const dz = position[2] - room.satellitePosition[2];
    player.distanceToSatellite = Math.sqrt(dx * dx + dz * dz);

    // Broadcast position update
    io.to(roomId).emit('position-updated', {
      playerId: socket.id,
      position,
      rotation,
      distanceToSatellite: player.distanceToSatellite
    });
  });

  socket.on('player-reached-satellite', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room || room.winner) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    room.winner = socket.id;
    room.gamePhase = 'finished';

    const finalPositions = Array.from(room.players.values())
      .filter(p => !p.isEliminated)
      .sort((a, b) => a.distanceToSatellite - b.distanceToSatellite);

    io.to(roomId).emit('game-over', {
      winner: {
        id: player.id,
        name: player.name,
        color: player.color
      },
      finalPositions,
      currentLevel: room.currentRound,
      nextLevel: room.currentRound + 1
    });

    console.log(`${player.name} won level ${room.currentRound} in room ${roomId}!`);
  });

  socket.on('player-crashed', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    player.isEliminated = true;

    io.to(roomId).emit('player-eliminated', {
      playerId: socket.id,
      playerName: player.name
    });
  });

  socket.on('start-next-level', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room || socket.id !== room.hostId) return;

    startNextLevel(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove player from all rooms
    rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.players.delete(socket.id);

        // If host left, assign new host
        if (room.hostId === socket.id && room.players.size > 0) {
          room.hostId = Array.from(room.players.keys())[0];
          io.to(roomId).emit('new-host', room.hostId);
        }

        // Broadcast player left
        io.to(roomId).emit('player-left', {
          playerId: socket.id,
          players: Array.from(room.players.values())
        });

        // Delete empty rooms
        if (room.players.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  });
});

function startCodingTimer(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const interval = setInterval(() => {
    room.codingTimer--;

    io.to(roomId).emit('timer-update', room.codingTimer);

    if (room.codingTimer <= 0) {
      clearInterval(interval);
      startExecution(roomId);
    }
  }, 1000);
}

function startExecution(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.gamePhase = 'executing';

  const activePlayers = Array.from(room.players.values())
    .filter(p => !p.isEliminated && p.isReady);

  // Broadcast to all clients to start executing ALL rovers simultaneously
  io.to(roomId).emit('execution-started', {
    players: activePlayers.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      commands: p.submittedCode
    }))
  });

  // No turn-by-turn execution - all rovers move at once
  // Clients will handle their own rover animation
}

function executeNextTurn(roomId: string) {
  // This function is no longer needed for parallel execution
  // Keeping it for backwards compatibility but it does nothing
  return;
}

function startNextLevel(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  // Reset for next level
  room.currentRound++;
  room.gamePhase = 'coding';
  room.codingTimer = 30;
  room.winner = null;

  // Reset all players
  room.players.forEach(player => {
    player.submittedCode = null;
    player.isEliminated = false;
    player.position = [0, 0, 0];
    player.rotation = Math.PI;
    player.distanceToSatellite = 0;
  });

  // Generate new satellite position with increased difficulty
  room.satellitePosition = randomSatellitePosition(room.currentRound);

  io.to(roomId).emit('level-started', {
    level: room.currentRound,
    satellitePosition: room.satellitePosition,
    gamePhase: 'coding'
  });

  startCodingTimer(roomId);
}

function endRound(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.winner) return;

  // Reset for next round
  room.currentRound++;
  room.gamePhase = 'coding';
  room.codingTimer = 30;
  room.currentTurnIndex = 0;

  // Clear submitted code
  room.players.forEach(player => {
    player.submittedCode = null;
  });

  io.to(roomId).emit('round-ended', {
    nextRound: room.currentRound
  });

  startCodingTimer(roomId);
}

httpServer.listen(PORT, () => {
  console.log(`🚀 Multiplayer server running on port ${PORT}`);
});
