import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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
  hasFinishedExecution?: boolean;
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

const rooms = new Map<string, GameRoom>();
const timers = new Map<string, NodeJS.Timeout>(); // Track active timers per room

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

  // Difficulty Scaling: 
  // Level 1-5: Close range (50-100)
  // Level 6-10: Medium range (100-200)
  // Level 11-20: Long range (200-400) + Complex angles

  let minBase = 50;
  let maxBase = 100;

  if (level > 5) { minBase = 100; maxBase = 200; }
  if (level > 10) { minBase = 200; maxBase = 400; }

  const dist = minBase + Math.random() * (maxBase - minBase);

  // Ensure we don't go too far for now (keep within Scene bounds roughly or expand scene)
  // Clamping to 400 for safety as boundary is around 100-200 in current scene setting but let's assume scene expands

  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;

  return [x, 5, z];
}

app.prepare().then(() => {
  let io: Server;

  const httpServer = createServer((req, res) => {
    // Delegate to Next.js for all non-socket requests
    // Explicitly pass socket.io requests to the engine to ensure they are handled
    if (req.url?.startsWith('/socket.io') && io) {
      // @ts-ignore - handleRequest is internal but public enough for this use case
      io.engine.handleRequest(req, res);
      return;
    }
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  io = new Server(httpServer, {
    // In production, Next.js serves the client, so same origin is fine.
    // We allow CORS for dev or if env var is set.
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any origin (effectively reflecting it) for now to fix connection issues
        // In a strict environment, we would check against a whitelist here.
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
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

      // Check if all players are eliminated (Game Over / Draw?)
      // For now, let's keep it simple. If eliminated, they just spectate.
      checkRoundCompletion(roomId);
    });

    socket.on('player-execution-finished', (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || room.gamePhase !== 'executing') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.hasFinishedExecution = true;

      checkRoundCompletion(roomId);
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
            // Clear any active timer
            const timer = timers.get(roomId);
            if (timer) {
              clearInterval(timer);
              timers.delete(roomId);
            }
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          } else {
            // Check if game should proceed (e.g. if the disconnected player was the last one running)
            checkRoundCompletion(roomId);
          }
        }
      });
    });
  });

  function startCodingTimer(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Clear any existing timer for this room
    const existingTimer = timers.get(roomId);
    if (existingTimer) {
      clearInterval(existingTimer);
      console.log(`Cleared existing timer for room ${roomId}`);
    }

    const interval = setInterval(() => {
      room.codingTimer--;

      io.to(roomId).emit('timer-update', room.codingTimer);

      if (room.codingTimer <= 0) {
        clearInterval(interval);
        timers.delete(roomId);
        startExecution(roomId);
      }
    }, 1000);

    timers.set(roomId, interval);
    console.log(`Started coding timer for room ${roomId} at ${room.codingTimer} seconds`);
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

  function checkRoundCompletion(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.gamePhase !== 'executing') return;

    // Check if ALL active players have finished execution or are eliminated
    // Players who are NOT ready are ignored (they are spectators)
    const activePlayers = Array.from(room.players.values()).filter(p => p.isReady);

    if (activePlayers.length === 0) {
      // Should not happen if game is running, but safety check
      return;
    }

    const allFinished = activePlayers.every(p => p.hasFinishedExecution || p.isEliminated);

    if (allFinished) {
      // Loop back to coding phase if no winner
      if (!room.winner) {
        restartCodingPhase(roomId);
      }
    }
  }

  function restartCodingPhase(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.gamePhase = 'coding';
    room.codingTimer = 30;

    // Reset submission status but KEEP positions
    room.players.forEach(player => {
      player.submittedCode = null;
      player.hasFinishedExecution = false;
      // Note: Eliminated players say eliminated until next level? 
      // Usually in these games, crashing resets you to start OR you wait.
      // For now, let's KEEP them eliminated until Next Level starts.
    });

    io.to(roomId).emit('coding-phase-restarted', {
      codingTimer: room.codingTimer
    });

    startCodingTimer(roomId);
  }

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
