require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY
);

const { z } = require('zod');

// ── Constants ──────────────────────────────────────────────────────────────────
const DISCONNECT_GRACE_PERIOD_MS = 30 * 1000; // 30s for reconnection
const MIN_PLAYERS_TO_START = 2;

// ── Validation schemas and helpers (B1/B2/B9) ─────────────────────────────────
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIFFICULTY_MAP = { easy: 1, medium: 2, hard: 3 };
const LEGACY_DIFFICULTY_MAP = { facil: 'easy', medio: 'medium', dificil: 'hard' };
const VALID_LANGUAGES = ['EN', 'PT', 'ES', 'PL', 'ZH', 'AR'];

const selectClueSchema = z.object({
  row: z.number().int().min(0).max(4),
  col: z.number().int().min(0).max(4),
});

const guessSchema = z.object({
  row: z.number().int().min(0).max(4),
  col: z.number().int().min(0).max(4),
});

function sanitizeGridSize(value) {
  return Math.min(5, Math.max(3, Number(value) || 4));
}

function sanitizeDifficulty(value) {
  const normalized = LEGACY_DIFFICULTY_MAP[value] || value;
  return VALID_DIFFICULTIES.includes(normalized) ? normalized : 'medium';
}

function sanitizeWordLanguage(value) {
  return VALID_LANGUAGES.includes(value) ? value : 'EN';
}

function sanitizePlayerName(value) {
  if (typeof value !== 'string') return 'Player';
  const trimmed = value.trim().slice(0, 15);
  return trimmed.length > 0 ? trimmed : 'Player';
}

// ── Admin auth & rate limiting (B4/B5/B6) ─────────────────────────────────────
function requireAdminAuth(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'Not found' });
    }
    return next();
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

const wordCache = {};

// ── Clue Validation (US-02 / US-03) ──────────────────────────────────────────
const CLUE_VALIDATION_ERRORS = {
  empty: {
    EN: 'Type a word first',
    PT: 'Digite uma palavra primeiro',
  },
  multipleWords: {
    EN: 'Clue must be a single word',
    PT: 'A dica deve ser uma unica palavra',
  },
  number: {
    EN: 'Clue cannot be a number',
    PT: 'A dica nao pode ser um numero',
  },
  abbreviation: {
    EN: 'Clue cannot be an abbreviation',
    PT: 'A dica nao pode ser uma sigla',
  },
  compoundWord: {
    EN: 'Clue cannot be a compound word',
    PT: 'A dica nao pode ser palavra composta',
  },
  tooLong: {
    EN: 'Clue is too long (max 15 characters)',
    PT: 'Dica muito longa (maximo 15 caracteres)',
  },
  notYourTurn: {
    EN: "It's not your turn",
    PT: 'Nao e sua vez',
  },
  maliciousInput: {
    EN: 'Clue contains invalid characters',
    PT: 'A dica contem caracteres invalidos',
  },
};

function getClueError(key, language = 'PT') {
  const lang = language === 'EN' ? 'EN' : 'PT';
  return CLUE_VALIDATION_ERRORS[key][lang];
}

function validateClue(clue, language = 'PT') {
  const lang = language === 'EN' ? 'EN' : 'PT';
  const getError = (key) => getClueError(key, lang);

  if (!clue || typeof clue !== 'string') {
    return { valid: false, error: getError('empty') };
  }

  const trimmed = clue.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: getError('empty') };
  }

  // Rule 1: Single word only
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount !== 1) {
    return { valid: false, error: getError('multipleWords') };
  }

  // Rule 2: Not a pure number
  if (/^\d+$/.test(trimmed)) {
    return { valid: false, error: getError('number') };
  }

  // Rule 3: Not an abbreviation (2-3 uppercase chars)
  if (/^[A-Z]{2,3}$/.test(trimmed)) {
    return { valid: false, error: getError('abbreviation') };
  }

  // Rule 4: No compound words with hyphens
  if (trimmed.includes('-')) {
    return { valid: false, error: getError('compoundWord') };
  }

  // Rule 5: Max 15 characters
  if (trimmed.length > 15) {
    return { valid: false, error: getError('tooLong') };
  }

  return { valid: true };
}

// ── Words: fallback from public/words.json (B2) ──────────────────────────────
function loadFallbackWords() {
  try {
    const filePath = path.join(__dirname, 'public', 'words.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[WARN] Could not load fallback words.json:', err.message);
    return null;
  }
}

async function loadWordsByLanguage(language) {
  if (wordCache[language]) return wordCache[language];

  try {
    const { data, error } = await supabase
      .from('words')
      .select('word, level')
      .eq('language', language)
      .eq('is_active', true);

    if (error) throw error;

    if (data && data.length > 0) {
      const result = { easy: [], medium: [], hard: [] };
      data.forEach(row => {
        const level = row.level ?? row.Level;
        const word = row.word;
        if (level === 1) result.easy.push(word);
        else if (level === 2) result.medium.push(word);
        else if (level === 3) result.hard.push(word);
      });
      wordCache[language] = result;
      return result;
    }
  } catch (err) {
    console.error(`[WARN] Supabase query failed for language ${language}:`, err.message);
  }

  // Fallback to public/words.json when Supabase fails or returns empty
  const fallback = loadFallbackWords();
  if (fallback && fallback[language]) {
    console.log(`[INFO] Using fallback words.json for language ${language}`);
    wordCache[language] = fallback[language];
    return fallback[language];
  }

  // Last resort: try EN fallback for any language
  if (fallback && fallback.EN) {
    console.log(`[INFO] Falling back to EN words for language ${language}`);
    wordCache[language] = fallback.EN;
    return fallback.EN;
  }

  throw new Error('No words available. Add words to Supabase or public/words.json.');
}

// ── Room helpers ──────────────────────────────────────────────────────────────
const rooms = new Map();
const disconnectTimers = new Map(); // key: `${roomCode}:${playerToken}` -> timeout

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function generatePlayerToken() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createGrid(words, size) {
  const shuffled = shuffleArray(words);
  const selected = shuffled.slice(0, size * 2);
  const rows = selected.slice(0, size);
  const cols = selected.slice(size, size * 2);
  const grid = [];
  for (let i = 0; i < size; i++) {
    grid[i] = [];
    for (let j = 0; j < size; j++) {
      grid[i][j] = {
        rowWord: rows[i],
        colWord: cols[j],
        clue: null,
        clueBy: null,
        revealed: false,
        revealedBy: null,
      };
    }
  }
  return { rows, cols, grid };
}

function createCardDeck(grid, gridSize) {
  const cards = [];
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (!grid[i][j].revealed) {
        cards.push({
          row: i,
          col: j,
          label: `${colLetters[j]}${i + 1}`,
          rowWord: grid[i][j].rowWord,
          colWord: grid[i][j].colWord,
        });
      }
    }
  }
  return shuffleArray(cards);
}

function createRoom(hostName, difficulty, gridSize, wordLanguage) {
  const sanitizedGridSize = sanitizeGridSize(gridSize);
  const sanitizedDifficulty = sanitizeDifficulty(difficulty);
  const sanitizedLanguage = sanitizeWordLanguage(wordLanguage);
  const code = generateRoomCode();
  const room = {
    code,
    host: null,
    players: [],
    state: 'waiting',
    difficulty: sanitizedDifficulty,
    gridSize: sanitizedGridSize,
    wordLanguage: sanitizedLanguage,
    rows: [],
    cols: [],
    grid: [],
    currentTurn: 0,
    cluesGiven: 0,
    maxClues: sanitizedGridSize * sanitizedGridSize,
    currentClue: null,
    cardDeck: [],
    discardPile: [],
    drawnCard: null,
    groupGuessMade: false, // US-003: one guess per clue
  };
  rooms.set(code, room);
  return room;
}

function getPlayerColor(index) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  return colors[index % colors.length];
}

// US-002: Team score = number of revealed cells
function calculateTeamScore(room) {
  // Grid is empty during the 'waiting' state (before start-game)
  if (!room.grid || room.grid.length === 0) return 0;
  let score = 0;
  for (let i = 0; i < room.grid.length; i++) {
    const row = room.grid[i];
    if (!Array.isArray(row)) continue;
    for (let j = 0; j < row.length; j++) {
      if (row[j] && row[j].revealed) score++;
    }
  }
  return score;
}

function getRoomState(room) {
  const safeGrid = room.grid.map(row =>
    row.map(cell => ({
      rowWord: cell.rowWord,
      colWord: cell.colWord,
      clue: cell.clue,
      clueBy: cell.clueBy,
      revealed: cell.revealed,
      revealedBy: cell.revealedBy,
    }))
  );
  return {
    code: room.code,
    host: room.host,
    players: room.players.map(p => ({
      id: p.id,
      playerToken: p.playerToken,
      name: p.name,
      isHost: p.isHost,
      color: p.color,
      isDisconnected: p.isDisconnected || false,
    })),
    state: room.state,
    difficulty: room.difficulty,
    gridSize: room.gridSize,
    wordLanguage: room.wordLanguage,
    rows: room.rows,
    cols: room.cols,
    grid: safeGrid,
    currentTurn: room.currentTurn,
    teamScore: calculateTeamScore(room), // US-002: cooperative score
    cluesGiven: room.cluesGiven,
    maxClues: room.maxClues,
    currentClue: room.currentClue,
    cardDeckCount: room.cardDeck.length,
    discardPileCount: room.discardPile.length,
    drawnCard: room.drawnCard,
  };
}

function checkAllRevealed(room) {
  for (let i = 0; i < room.gridSize; i++) {
    for (let j = 0; j < room.gridSize; j++) {
      if (!room.grid[i][j].revealed) return false;
    }
  }
  return true;
}

function advanceTurnSkippingBots(room) {
  if (!room.players.length) return;
  let nextTurn = (room.currentTurn + 1) % room.players.length;
  let attempts = 0;
  while (attempts < room.players.length && room.players[nextTurn]?.id?.startsWith('bot_')) {
    nextTurn = (nextTurn + 1) % room.players.length;
    attempts++;
  }
  room.currentTurn = nextTurn;
}

/**
 * Remove a player from a room after the disconnect grace period expires.
 * Handles host reassignment, turn adjustment, and room cleanup.
 */
function removePlayerAfterGracePeriod(ioRef, roomCode, playerToken, playerName) {
  const timerKey = `${roomCode}:${playerToken}`;
  const timer = setTimeout(() => {
    disconnectTimers.delete(timerKey);
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.playerToken !== playerToken);

    if (room.players.length === 0) {
      rooms.delete(roomCode);
      return;
    }

    // Reassign host if needed
    if (room.host === playerName) {
      room.host = room.players[0].id;
      room.players[0].isHost = true;
    }

    // Fix currentTurn if out of bounds
    if (room.state === 'playing' && room.currentTurn >= room.players.length) {
      room.currentTurn = 0;
    }

    ioRef.to(roomCode).emit('player-left', { playerName, room: getRoomState(room) });
  }, DISCONNECT_GRACE_PERIOD_MS);
  disconnectTimers.set(timerKey, timer);
}

// ── App & Server ─────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer, {
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Security middleware
  server.use(helmet({ contentSecurityPolicy: false }));
  server.use(cors());
  server.use(express.json({ limit: '10kb' }));

  // ── REST API routes (protected where required) ────────────────────────────
  server.get('/api/reload-words', requireAdminAuth, adminLimiter, async (req, res) => {
    Object.keys(wordCache).forEach(k => delete wordCache[k]);
    res.json({ success: true, message: 'Word cache cleared' });
  });

  server.get('/api/words', (req, res) => {
    const keys = Object.keys(wordCache);
    res.json({
      wordCacheKeys: keys,
      levelCacheKeys: keys,
    });
  });

  server.post('/api/words', requireAdminAuth, adminLimiter, async (req, res) => {
    const { word, level, language } = req.body;
    const legacyLevel = req.body.Level;
    const rawLevel = level ?? legacyLevel ?? 1;
    const finalLevel = [1, 2, 3].includes(Number(rawLevel)) ? Number(rawLevel) : 1;
    const finalLanguage = VALID_LANGUAGES.includes(language) ? language : 'EN';
    const sanitizedWord = typeof word === 'string' ? word.trim().toUpperCase().slice(0, 20) : '';
    if (!sanitizedWord) return res.status(400).json({ error: 'word is required' });
    if (!/^[A-Z]+$/.test(sanitizedWord)) return res.status(400).json({ error: 'word must contain only letters A-Z' });
    try {
      const { data, error } = await supabase.from('words').insert([{ word: sanitizedWord, level: finalLevel, language: finalLanguage, is_active: true }]).select();
      if (error) throw error;
      res.json({ success: true, word: data[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  server.get('/api/supabase/test', requireAdminAuth, adminLimiter, async (req, res) => {
    try {
      const { count, error } = await supabase.from('words').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ success: true, connected: true, totalCount: count });
    } catch (err) {
      res.json({ success: false, connected: false, totalCount: 0 });
    }
  });

  server.get('/api/supabase/tables', requireAdminAuth, adminLimiter, async (req, res) => {
    try {
      const { data: words, error: wordsErr } = await supabase.from('words').select('*').limit(20);
      if (wordsErr) throw wordsErr;
      const counts = { level1: 0, level2: 0, level3: 0 };
      words.forEach(r => { const lvl = r.level ?? r.Level; if (lvl) counts['level' + lvl]++; });
      res.json({ success: true, tables: { words: { data: words, counts } } });
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  });

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[CONNECT] Player connected: ${socket.id}`);

    // ── CREATE ROOM ──────────────────────────────────────────────────────────
    socket.on('create-room', async ({ playerName, difficulty, gridSize, wordLanguage }, callback) => {
      const sanitizedPlayerName = sanitizePlayerName(playerName);
      const sanitizedGridSize = sanitizeGridSize(gridSize);
      const sanitizedDifficulty = sanitizeDifficulty(difficulty);
      const sanitizedLanguage = sanitizeWordLanguage(wordLanguage);
      const room = createRoom(sanitizedPlayerName, sanitizedDifficulty, sanitizedGridSize, sanitizedLanguage);
      const playerToken = generatePlayerToken();
      const player = {
        id: socket.id,
        playerToken,
        name: sanitizedPlayerName,
        isHost: true,
        color: getPlayerColor(0),
        isDisconnected: false,
      };
      room.host = socket.id;
      room.players.push(player);
      socket.join(room.code);
      socket.roomCode = room.code;
      callback({ success: true, room: getRoomState(room), player });
    });

    // ── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      const sanitizedJoinName = sanitizePlayerName(playerName);
      const room = rooms.get(roomCode);
      if (!room) return callback({ success: false, error: 'Sala nao encontrada' });
      if (room.state !== 'waiting') return callback({ success: false, error: 'Jogo ja comecou' });
      if (room.players.length >= 6) return callback({ success: false, error: 'Sala cheia (max. 6 jogadores)' });
      const playerToken = generatePlayerToken();
      const player = {
        id: socket.id,
        playerToken,
        name: sanitizedJoinName,
        isHost: false,
        color: getPlayerColor(room.players.length),
        isDisconnected: false,
      };
      room.players.push(player);
      socket.join(room.code);
      socket.roomCode = room.code;
      callback({ success: true, room: getRoomState(room), player });
      io.to(room.code).emit('room-updated', getRoomState(room));
    });

    // ── REJOIN ROOM (US-009: reconnection) ───────────────────────────────────
    socket.on('rejoin-room', ({ roomCode, playerId, playerName }, callback) => {
      if (!roomCode || !playerId) {
        return callback({ success: false, error: 'Missing roomCode or playerId' });
      }

      const room = rooms.get(roomCode);
      if (!room) {
        return callback({ success: false, error: 'Room not found or expired' });
      }

      // Find player by token
      const player = room.players.find(p => p.playerToken === playerId);
      if (!player) {
        return callback({ success: false, error: 'Player not found in this room' });
      }

      // Cancel disconnect timer if active
      const timerKey = `${roomCode}:${playerId}`;
      const timer = disconnectTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(timerKey);
      }

      // Reassociate socket
      player.id = socket.id;
      player.isDisconnected = false;
      if (playerName) player.name = sanitizePlayerName(playerName);
      socket.join(roomCode);
      socket.roomCode = roomCode;

      console.log(`[REJOIN] Player ${player.name} reconnected to room ${roomCode}`);
      io.to(roomCode).emit('player-reconnected', {
        playerName: player.name,
        playerId: player.playerToken,
      });

      callback({
        success: true,
        room: getRoomState(room),
        player: {
          id: player.id,
          playerToken: player.playerToken,
          name: player.name,
          isHost: player.isHost,
          color: player.color,
        },
      });
    });

    // ── ADD TEST PLAYER ──────────────────────────────────────────────────────
    socket.on('add-test-player', (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room) return callback({ success: false, error: 'Nao esta em uma sala' });
      if (room.host !== socket.id) return callback({ success: false, error: 'Apenas o host pode adicionar jogadores' });
      if (room.players.length >= 6) return callback({ success: false, error: 'Sala cheia (max. 6 jogadores)' });
      const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Omega'];
      const botName = botNames[room.players.length - 1] || `Bot ${room.players.length}`;
      const botId = `bot_${Date.now()}_${room.players.length}`;
      const playerToken = generatePlayerToken();
      const player = {
        id: botId,
        playerToken,
        name: botName,
        isHost: false,
        color: getPlayerColor(room.players.length),
        isDisconnected: false,
      };
      room.players.push(player);
      callback({ success: true, room: getRoomState(room) });
      io.to(room.code).emit('room-updated', getRoomState(room));
    });

    // ── START GAME ───────────────────────────────────────────────────────────
    socket.on('start-game', async (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.host !== socket.id) return callback({ success: false, error: 'Apenas o host pode iniciar' });

      // US-001: minimum 2 players
      if (room.players.length < MIN_PLAYERS_TO_START) {
        return callback({ success: false, error: 'Minimo 2 jogadores para iniciar' });
      }

      room.gridSize = sanitizeGridSize(room.gridSize);
      room.difficulty = sanitizeDifficulty(room.difficulty);
      room.wordLanguage = sanitizeWordLanguage(room.wordLanguage);

      const wordLists = await loadWordsByLanguage(room.wordLanguage);
      const words = wordLists[room.difficulty] || wordLists.medium;

      // B2: Validate minimum words available
      const requiredWords = room.gridSize * 2;
      if (words.length < requiredWords) {
        return callback({
          success: false,
          error: `Palavras insuficientes. Necessario pelo menos ${requiredWords} palavras para grade ${room.gridSize}x${room.gridSize}.`,
        });
      }

      const { rows, cols, grid } = createGrid(words, room.gridSize);
      room.rows = rows;
      room.cols = cols;
      room.grid = grid;
      room.state = 'playing';
      room.currentTurn = 0;
      room.cluesGiven = 0;
      room.currentClue = null;
      room.cardDeck = createCardDeck(grid, room.gridSize);
      room.discardPile = [];
      room.drawnCard = null;
      room.groupGuessMade = false; // US-003

      io.to(room.code).emit('game-started', getRoomState(room));
      callback({ success: true });
    });

    // ── DRAW CARD ────────────────────────────────────────────────────────────
    socket.on('draw-card', (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) return callback({ success: false, error: 'Nao e sua vez' });
      if (room.drawnCard) return callback({ success: false, error: 'Voce ja comprou uma carta' });
      if (room.currentClue) return callback({ success: false, error: 'Ha uma dica ativa' });

      // US-012: If deck AND discard are empty, game is finished
      if (room.cardDeck.length === 0) {
        if (room.discardPile.length === 0) {
          room.state = 'finished';
          io.to(room.code).emit('game-finished', getRoomState(room));
          return callback({ success: false, error: 'Nenhuma carta restante. Jogo encerrado.' });
        }
        room.cardDeck = shuffleArray(room.discardPile);
        room.discardPile = [];
      }

      const card = room.cardDeck.pop();
      const cell = room.grid[card.row][card.col];
      if (cell.revealed) {
        room.discardPile.push(card);
        // Try to draw another card (recursion not needed, just re-check)
        if (room.cardDeck.length === 0 && room.discardPile.length > 0) {
          room.cardDeck = shuffleArray(room.discardPile);
          room.discardPile = [];
        }
        if (room.cardDeck.length === 0) {
          room.state = 'finished';
          io.to(room.code).emit('game-finished', getRoomState(room));
          return callback({ success: false, error: 'Todas as cartas restantes sao de celulas ja reveladas. Jogo encerrado.' });
        }
        const nextCard = room.cardDeck.pop();
        const nextCell = room.grid[nextCard.row][nextCard.col];
        nextCard.rowWord = nextCell.rowWord;
        nextCard.colWord = nextCell.colWord;
        room.drawnCard = nextCard;
        console.log(`[DRAW] Card drawn by ${currentPlayer.name}: ${nextCard.label} (${nextCard.rowWord} x ${nextCard.colWord}), deck: ${room.cardDeck.length}`);
        socket.emit('card-drawn', { cardLabel: nextCard.label, cardRow: nextCard.row, cardCol: nextCard.col, rowWord: nextCard.rowWord, colWord: nextCard.colWord, drawnBy: currentPlayer.name, deckCount: room.cardDeck.length });
        io.to(room.code).emit('turn-updated', { currentTurn: room.currentTurn, currentPlayer: currentPlayer.name });
        return callback({ success: true, card: nextCard });
      }

      card.rowWord = cell.rowWord;
      card.colWord = cell.colWord;
      room.drawnCard = card;
      console.log(`[DRAW] Card drawn by ${currentPlayer.name}: ${card.label} (${card.rowWord} x ${card.colWord}), deck: ${room.cardDeck.length}`);
      socket.emit('card-drawn', { cardLabel: card.label, cardRow: card.row, cardCol: card.col, rowWord: card.rowWord, colWord: card.colWord, drawnBy: currentPlayer.name, deckCount: room.cardDeck.length });
      io.to(room.code).emit('turn-updated', { currentTurn: room.currentTurn, currentPlayer: currentPlayer.name });
      callback({ success: true, card });
    });

    // ── PASS TURN ────────────────────────────────────────────────────────────
    socket.on('pass-turn', (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) return callback({ success: false, error: 'Nao e sua vez' });
      if (!room.drawnCard) return callback({ success: false, error: 'Voce nao comprou uma carta' });
      // Fix: return card to deck at random position instead of discarding permanently
      // Previously: room.discardPile.push(room.drawnCard) caused card to disappear
      room.cardDeck.splice(Math.floor(Math.random() * (room.cardDeck.length + 1)), 0, room.drawnCard);
      room.drawnCard = null;
      room.currentClue = null;
      room.groupGuessMade = false;
      advanceTurnSkippingBots(room);
      io.to(room.code).emit('turn-passed', { passedBy: currentPlayer.name, currentTurn: room.currentTurn, currentPlayer: room.players[room.currentTurn]?.name });
      callback({ success: true });
    });

    // ── SELECT CLUE CELL ─────────────────────────────────────────────────────
    socket.on('select-clue-cell', ({ row, col }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const parsed = selectClueSchema.safeParse({ row, col });
      if (!parsed.success) return callback({ success: false, error: 'Coordenadas invalidas' });
      if (row >= room.gridSize || col >= room.gridSize) return callback({ success: false, error: 'Coordenadas invalidas: fora dos limites da grade ' + room.gridSize + 'x' + room.gridSize });
      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) return callback({ success: false, error: 'Nao e sua vez de dar dica' });
      if (!room.drawnCard) return callback({ success: false, error: 'Voce precisa comprar uma carta primeiro' });
      if (row !== room.drawnCard.row || col !== room.drawnCard.col) return callback({ success: false, error: 'So pode usar a celula da carta comprada' });
      if (!room.grid[row] || !room.grid[row][col]) return callback({ success: false, error: 'Coordenadas invalidas' });
      const cell = room.grid[row][col];
      if (!cell) return callback({ success: false, error: 'Coordenadas invalidas' });
      if (cell.revealed) return callback({ success: false, error: 'Celula ja foi revelada' });
      room.currentClue = { row, col, rowWord: cell.rowWord, colWord: cell.colWord };
      room.groupGuessMade = false; // US-003: new clue, group can guess
      io.to(room.code).emit('clue-cell-selected', { row, col, clueGiver: currentPlayer.name, isClueGiver: true });
      socket.emit('clue-words', { rowWord: cell.rowWord, colWord: cell.colWord });
      callback({ success: true });
    });

    // ── SUBMIT CLUE ──────────────────────────────────────────────────────────
    socket.on('submit-clue', ({ clue }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing' || !room.currentClue) {
        return callback({ success: false, error: 'Sem dica ativa' });
      }

      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) {
        return callback({ success: false, error: getClueError('notYourTurn', room.wordLanguage) });
      }

      // Server-side clue validation (US-02 / US-03)
      const validation = validateClue(clue, room.wordLanguage);
      if (!validation.valid) {
        console.log(`[VALIDATION] Clue rejected for ${currentPlayer.name}: "${clue}" -> ${validation.error}`);
        return callback({ success: false, error: validation.error });
      }

      // Sanitize: reject HTML/XSS characters that passed text validation
      const SANITIZE_REGEX = /[<>"'&]/;
      if (SANITIZE_REGEX.test(clue.trim())) {
        console.log(`[SECURITY] Malicious input rejected for ${currentPlayer.name}: "${clue}"`);
        return callback({ success: false, error: getClueError('maliciousInput', room.wordLanguage) });
      }

      // Persist the validated clue
      const { row, col } = room.currentClue;
      room.grid[row][col].clue = clue.trim();
      room.grid[row][col].clueBy = currentPlayer.name;
      room.cluesGiven++;
      room.drawnCard = null;
      room.groupGuessMade = false; // US-003: reset — group can now guess once

      io.to(room.code).emit('clue-given', { row, col, clue: clue.trim(), clueBy: currentPlayer.name });
      callback({ success: true });
    });

    // ── GUESS CELL ───────────────────────────────────────────────────────────
    socket.on('guess-cell', ({ row, col }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const parsedGuess = guessSchema.safeParse({ row, col });
      if (!parsedGuess.success) return callback({ success: false, error: 'Coordenadas invalidas' });
      if (row >= room.gridSize || col >= room.gridSize) return callback({ success: false, error: 'Coordenadas invalidas: fora dos limites da grade ' + room.gridSize + 'x' + room.gridSize });
      if (!room.currentClue) return callback({ success: false, error: 'Sem dica ativa' });
      if (!room.grid[row] || !room.grid[row][col]) return callback({ success: false, error: 'Coordenadas invalidas' });
      const cell = room.grid[row][col];
      if (!cell) return callback({ success: false, error: 'Coordenadas invalidas' });
      if (cell.revealed) return callback({ success: false, error: 'Celula ja foi revelada' });

      // US-003: One guess per clue — block 2nd guess
      if (room.groupGuessMade) {
        return callback({ success: false, error: 'O grupo ja fez o palpite desta dica' });
      }

      // US-007: Clue giver cannot guess
      const currentPlayer = room.players[room.currentTurn];
      if (currentPlayer && currentPlayer.id === socket.id) {
        return callback({ success: false, error: 'Quem deu a dica nao pode adivinhar' });
      }

      // Mark that the group has made a guess for this clue
      room.groupGuessMade = true;

      const guessCorrect = (row === room.currentClue.row && col === room.currentClue.col);

      if (guessCorrect) {
        cell.revealed = true;
        cell.revealedBy = socket.id;
        room.currentClue = null;
        room.drawnCard = null;
        room.groupGuessMade = false;

        const teamScore = calculateTeamScore(room);
        const guesserName = room.players.find(p => p.id === socket.id)?.name;

        io.to(room.code).emit('cell-revealed', {
          row,
          col,
          revealedBy: socket.id,
          playerName: guesserName,
          rowWord: cell.rowWord,
          colWord: cell.colWord,
          teamScore, // US-002: team score instead of individual
        });

        if (checkAllRevealed(room)) {
          room.state = 'finished';
          io.to(room.code).emit('game-finished', getRoomState(room));
        } else {
          // US-006: always advance turn after guess
          room.currentTurn = (room.currentTurn + 1) % room.players.length;
          io.to(room.code).emit('turn-changed', {
            currentTurn: room.currentTurn,
            currentPlayer: room.players[room.currentTurn]?.name,
          });
        }
        callback({ success: true, correct: true });
      } else {
        // US-006: wrong guess — clear clue, advance turn
        const clueRow = room.currentClue.row;
        const clueCol = room.currentClue.col;
        room.grid[clueRow][clueCol].clue = null;
        room.grid[clueRow][clueCol].clueBy = null;
        room.currentClue = null;
        room.drawnCard = null;
        room.groupGuessMade = false;

        const guesserName = room.players.find(p => p.id === socket.id)?.name;

        io.to(room.code).emit('wrong-guess', {
          row,
          col,
          clueRow,
          clueCol,
          guessedBy: socket.id,
          playerName: guesserName,
        });

        // US-006: always advance turn
        room.currentTurn = (room.currentTurn + 1) % room.players.length;
        io.to(room.code).emit('turn-changed', {
          currentTurn: room.currentTurn,
          currentPlayer: room.players[room.currentTurn]?.name,
        });
        callback({ success: true, correct: false });
      }
    });

    // ── RESTART GAME ─────────────────────────────────────────────────────────
    socket.on('restart-game', async (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.host !== socket.id) return callback({ success: false, error: 'Apenas o host pode reiniciar' });

      const wordLists = await loadWordsByLanguage(room.wordLanguage);
      const words = wordLists[room.difficulty] || wordLists.medium;

      // B2: Validate minimum words
      const requiredWords = room.gridSize * 2;
      if (words.length < requiredWords) {
        return callback({
          success: false,
          error: `Palavras insuficientes. Necessario pelo menos ${requiredWords} palavras para grade ${room.gridSize}x${room.gridSize}.`,
        });
      }

      const { rows, cols, grid } = createGrid(words, room.gridSize);
      room.rows = rows;
      room.cols = cols;
      room.grid = grid;
      room.state = 'playing';
      room.currentTurn = 0;
      room.cluesGiven = 0;
      room.currentClue = null;
      room.cardDeck = createCardDeck(grid, room.gridSize);
      room.discardPile = [];
      room.drawnCard = null;
      room.groupGuessMade = false;

      io.to(room.code).emit('game-restarted', getRoomState(room));
      callback({ success: true });
    });

    // ── LEAVE ROOM ───────────────────────────────────────────────────────────
    socket.on('leave-room', (callback) => {
      const roomCode = socket.roomCode;
      if (!roomCode) return callback({ success: false, error: 'Nao esta em uma sala' });
      const room = rooms.get(roomCode);
      if (!room) return callback({ success: false, error: 'Sala nao encontrada' });

      const leavingPlayer = room.players.find(p => p.id === socket.id);
      room.players = room.players.filter(p => p.id !== socket.id);

      socket.leave(roomCode);
      socket.roomCode = null;

      if (room.players.length === 0) {
        rooms.delete(roomCode);
      } else {
        if (room.host === socket.id) {
          room.host = room.players[0].id;
          room.players[0].isHost = true;
        }
        if (room.state === 'playing' && room.currentTurn >= room.players.length) {
          room.currentTurn = 0;
        }
        io.to(roomCode).emit('player-left', { playerName: leavingPlayer?.name, room: getRoomState(room) });
      }
      callback({ success: true });
    });

    // ── DISCONNECT (US-009: grace period for reconnection) ───────────────────
    socket.on('disconnect', () => {
      const roomCode = socket.roomCode;
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;

      const disconnectedPlayer = room.players.find(p => p.id === socket.id);
      if (!disconnectedPlayer) return;

      console.log(`[DISCONNECT] Player ${disconnectedPlayer.name} disconnected. Grace period: ${DISCONNECT_GRACE_PERIOD_MS / 1000}s`);

      // Mark as disconnected but keep in room during grace period
      disconnectedPlayer.isDisconnected = true;
      io.to(roomCode).emit('player-disconnected', {
        playerName: disconnectedPlayer.name,
        playerId: disconnectedPlayer.playerToken,
      });

      // Start grace period timer
      removePlayerAfterGracePeriod(io, roomCode, disconnectedPlayer.playerToken, disconnectedPlayer.name);
    });
  });

  // Next.js handler for all other routes
  server.all('*', (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;

  httpServer.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`  CrossClues Online (Next.js)`);
    console.log(`  Running at http://localhost:${PORT}`);
    console.log(`=================================`);
  });
});
