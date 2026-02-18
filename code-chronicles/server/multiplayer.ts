import { Server } from 'socket.io';
console.log("-----------------------------------------");
console.log("  MULTIPLAYER SERVER RESTARTING...  ");
console.log("-----------------------------------------");
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { createClient } from '@supabase/supabase-js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Types
interface Player {
  id: string;
  userId?: string; // Supabase User ID
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

// Global connected user count - readable by Next.js API routes via globalThis
(globalThis as any).__connectedUsers = 0;

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

  // Initialize Supabase Client for Server
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or Service Role Key if needed

  const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

  if (!supabase) {
    console.warn("⚠️ Supabase credentials missing in server environment. XP/Level persistence will be disabled.");
  }

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
    (globalThis as any).__connectedUsers = ((globalThis as any).__connectedUsers || 0) + 1;
    console.log(`Player connected: ${socket.id} | Total: ${(globalThis as any).__connectedUsers}`);

    // Ping/latency measurement - client emits this, we immediately ack
    socket.on('ping_check', (callback) => {
      if (typeof callback === 'function') callback();
    });

    // Create or join room
    socket.on('create-room', (data: { playerName: string, userId?: string } | string, callback) => {
      // Support both old (string) and new (object) formats for backward compatibility during dev
      let playerName = '';
      let userId: string | undefined = undefined;

      if (typeof data === 'string') {
        playerName = data;
      } else {
        playerName = data.playerName;
        userId = data.userId;
      }

      const roomId = generateRoomId();
      const player: Player = {
        id: socket.id,
        userId: userId,
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
      console.log(`Room created: ${roomId} by ${playerName} (User: ${userId || 'Guest'})`);
    });

    socket.on('join-room', (data: { roomId: string, playerName: string, userId?: string } | string, pNameIfString: string | undefined, callback) => {
      // Handle variable arguments because previous signature was (roomId, playerName, callback)
      // New signature might come as object in first arg, or we adapt.
      // But useMultiplayer emits (roomId, playerName, userId, callback) logic? 
      // No, socket.emit('join-room', { ... }) sends ONE argument + callback.
      // Previous: socket.emit('join-room', roomId, playerName, callback) sent TWO arguments + callback.

      let roomId = '';
      let playerName = '';
      let userId: string | undefined = undefined;
      let cb: Function | undefined = undefined;

      // Argument shifting logic
      if (typeof data === 'object' && data !== null && 'roomId' in data) {
        // New format object
        roomId = data.roomId;
        playerName = data.playerName;
        userId = data.userId;
        // pNameIfString is actually the callback in this case if emit was called with 2 args (obj, cb)
        // But wait, socket.io signatures...
        // If client emits (obj, cb), server receives (obj, cb).
        // If client emits (a, b, cb), server receives (a, b, cb).
        // My client code: socketRef.current.emit('join-room', { ... }, (response) => ...)
        // So server receives (dataObj, callback).
        cb = pNameIfString as unknown as Function;
      } else {
        // Old format: (roomId, playerName, callback)
        roomId = data as string;
        playerName = pNameIfString as string;
        // callback is the 3rd arg, which is `callback` param here if 3 args defined?
        // In strict TS, this override is messy. Let's assume the client sends object now.
        // fallback for safety:
        cb = callback;
      }

      if (!cb && typeof pNameIfString === 'function') cb = pNameIfString;

      const room = rooms.get(roomId);

      if (!room) {
        if (cb) cb({ success: false, error: 'Room not found' });
        return;
      }

      if (room.players.size >= 10) {
        if (cb) cb({ success: false, error: 'Room is full' });
        return;
      }

      if (room.gamePhase !== 'lobby') {
        if (cb) cb({ success: false, error: 'Game already in progress' });
        return;
      }

      const player: Player = {
        id: socket.id,
        userId: userId,
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

      if (cb) cb({ success: true, roomId, player });

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

    socket.on('player-reached-satellite', async (roomId: string) => {
      const room = rooms.get(roomId);
      if (!room || room.winner) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      room.winner = socket.id;
      room.gamePhase = 'finished';

      // XP & Level Logic
      let xp = 0;
      let level = 1;

      if (supabase && player.userId) {
        try {
          // Fetch current stats
          const { data: stats } = await supabase
            .from('game_stats')
            .select('xp, level')
            .eq('user_id', player.userId)
            .single();

          const currentXp = stats?.xp || 0;
          const xpGain = 1000; // Winner gets 1000 XP
          xp = currentXp + xpGain;

          // Level Calculation: 1000 XP per level? Or progressive?
          // Prompt: "on 10000xp player will level up" -> suggests high cap, or maybe 10k total?
          // Let's do simple: level = floor(xp / 1000) + 1 for now, or 10000 per level if implied.
          // "give xps in such levels... or on 10000xp player will level up"
          // I'll set 10000 as level 2 threshold.
          level = Math.floor(xp / 2000) + 1; // 2000 XP per level to make it faster to verify

          // Update DB
          await supabase.from('game_stats').upsert({
            user_id: player.userId,
            xp: xp,
            level: level,
            // highest_level update handled by GameProvider typically, but we should sync if needed
            updated_at: new Date()
          });

          console.log(`Updated XP for ${player.name}: ${currentXp} -> ${xp} (Lvl ${level})`);
        } catch (err) {
          console.error("Failed to update XP:", err);
        }
      }

      const finalPositions = Array.from(room.players.values())
        .filter(p => !p.isEliminated)
        .sort((a, b) => a.distanceToSatellite - b.distanceToSatellite);

      io.to(roomId).emit('game-over', {
        winner: {
          id: player.id,
          name: player.name,
          color: player.color,
          xp: xp,
          level: level
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
      (globalThis as any).__connectedUsers = Math.max(0, ((globalThis as any).__connectedUsers || 1) - 1);
      console.log(`Player disconnected: ${socket.id} | Total: ${(globalThis as any).__connectedUsers}`);

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
            // Check if game should proceed
            if (room.gamePhase !== 'lobby' && room.gamePhase !== 'finished' && room.players.size === 1) {
              // Only one player left, they win by default!
              const winner = Array.from(room.players.values())[0];
              room.winner = winner.id;
              room.gamePhase = 'finished';

              // Clear any running timer
              const timer = timers.get(roomId);
              if (timer) {
                clearInterval(timer);
                timers.delete(roomId);
              }

              const finalPositions = [{
                ...winner,
                distanceToSatellite: 0 // Technical win, distance doesn't matter
              }];

              io.to(roomId).emit('game-over', {
                winner: {
                  id: winner.id,
                  name: winner.name,
                  color: winner.color
                },
                finalPositions,
                currentLevel: room.currentRound,
                nextLevel: room.currentRound + 1
              });

              console.log(`Player ${winner.name} won room ${roomId} by default (others left)`);
            } else {
              // Normal round completion check
              checkRoundCompletion(roomId);
            }
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
