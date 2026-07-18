require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { createClient } = require('@supabase/supabase-js');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

let WORD_LISTS = { facil: [], medio: [], dificil: [] };
let wordsLoaded = false;

async function loadWordsFromSupabase() {
  const { data, error } = await supabase
    .from('words')
    .select('word, Level')
    .eq('language', 'EN')
    .eq('is_active', true);

  if (error) throw error;

  const result = { facil: [], medio: [], dificil: [] };
  data.forEach(row => {
    const level = row.Level;
    const word = row.word;
    if (level === 1) result.facil.push(word);
    else if (level === 2) result.medio.push(word);
    else if (level === 3) result.dificil.push(word);
  });

  return result;
}

async function ensureWords() {
  if (!wordsLoaded) {
    WORD_LISTS = await loadWordsFromSupabase();
    wordsLoaded = true;
  }
  return WORD_LISTS;
}

const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
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

function createRoom(hostName, difficulty, gridSize) {
  const code = generateRoomCode();
  const words = WORD_LISTS[difficulty] || WORD_LISTS.medio;
  const { rows, cols, grid } = createGrid(words, gridSize);
  const room = {
    code,
    host: null,
    players: [],
    state: 'waiting',
    difficulty: difficulty || 'medio',
    gridSize: gridSize || 4,
    rows,
    cols,
    grid,
    currentTurn: 0,
    scores: {},
    cluesGiven: 0,
    maxClues: gridSize * gridSize,
    currentClue: null,
  };
  rooms.set(code, room);
  return room;
}

function getPlayerColor(index) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
  return colors[index % colors.length];
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
    players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, color: p.color })),
    state: room.state,
    difficulty: room.difficulty,
    gridSize: room.gridSize,
    rows: room.rows,
    cols: room.cols,
    grid: safeGrid,
    currentTurn: room.currentTurn,
    scores: room.scores,
    cluesGiven: room.cluesGiven,
    maxClues: room.maxClues,
    currentClue: room.currentClue,
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

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);

  // REST API routes
  server.get('/api/reload-words', async (req, res) => {
    WORD_LISTS = await loadWordsFromSupabase();
    wordsLoaded = true;
    const counts = {
      facil: WORD_LISTS.facil?.length || 0,
      medio: WORD_LISTS.medio?.length || 0,
      dificil: WORD_LISTS.dificil?.length || 0,
    };
    res.json({ success: true, counts });
  });

  server.get('/api/words', (req, res) => {
    res.json({
      facil: WORD_LISTS.facil?.length || 0,
      medio: WORD_LISTS.medio?.length || 0,
      dificil: WORD_LISTS.dificil?.length || 0,
    });
  });

  server.use(express.json());

  server.post('/api/words', async (req, res) => {
    const { word, Level, language } = req.body;
    if (!word) return res.status(400).json({ error: 'word is required' });
    try {
      const { data, error } = await supabase.from('words').insert([{ word, Level: Level || 1, language: language || 'EN', is_active: true }]).select();
      if (error) throw error;
      res.json({ success: true, word: data[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Supabase test endpoints
  server.get('/api/supabase/test', async (req, res) => {
    try {
      const { data, error, count } = await supabase.from('words').select('*', { count: 'exact' }).limit(5);
      if (error) throw error;
      res.json({ success: true, connected: true, sample: data, totalCount: count, url: process.env.SUPABASE_URL });
    } catch (err) {
      res.json({ success: false, connected: false, error: err.message, url: process.env.SUPABASE_URL });
    }
  });

  server.get('/api/supabase/tables', async (req, res) => {
    try {
      const { data: words, error: wordsErr } = await supabase.from('words').select('*').limit(20);
      if (wordsErr) throw wordsErr;
      const counts = { Level1: 0, Level2: 0, Level3: 0 };
      words.forEach(r => { if (r.Level) counts['Level' + r.Level]++; });
      res.json({ success: true, tables: { words: { data: words, counts } } });
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  });

  // Socket.IO
  io.on('connection', (socket) => {
    console.log(`Jogador conectado: ${socket.id}`);

    socket.on('create-room', async ({ playerName, difficulty, gridSize }, callback) => {
      await ensureWords();
      const room = createRoom(playerName, difficulty || 'medio', gridSize || 4);
      const player = { id: socket.id, name: playerName, isHost: true, color: getPlayerColor(0) };
      room.host = socket.id;
      room.players.push(player);
      room.scores[socket.id] = 0;
      socket.join(room.code);
      socket.roomCode = room.code;
      callback({ success: true, room: getRoomState(room), player });
    });

    socket.on('join-room', ({ roomCode, playerName }, callback) => {
      const room = rooms.get(roomCode);
      if (!room) return callback({ success: false, error: 'Sala nao encontrada' });
      if (room.state !== 'waiting') return callback({ success: false, error: 'Jogo ja comecou' });
      if (room.players.length >= 6) return callback({ success: false, error: 'Sala cheia (max. 6 jogadores)' });
      const player = { id: socket.id, name: playerName, isHost: false, color: getPlayerColor(room.players.length) };
      room.players.push(player);
      room.scores[socket.id] = 0;
      socket.join(room.code);
      socket.roomCode = room.code;
      callback({ success: true, room: getRoomState(room), player });
      io.to(room.code).emit('room-updated', getRoomState(room));
    });

    socket.on('start-game', async (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.host !== socket.id) return callback({ success: false, error: 'Apenas o host pode iniciar' });
      if (room.players.length < 2) return callback({ success: false, error: 'Minimo 2 jogadores' });
      await ensureWords();
      const { rows, cols, grid } = createGrid(WORD_LISTS[room.difficulty] || WORD_LISTS.medio, room.gridSize);
      room.rows = rows; room.cols = cols; room.grid = grid;
      room.state = 'playing'; room.currentTurn = 0; room.cluesGiven = 0; room.currentClue = null;
      Object.keys(room.scores).forEach(k => { room.scores[k] = 0; });
      io.to(room.code).emit('game-started', getRoomState(room));
      callback({ success: true });
    });

    socket.on('select-clue-cell', ({ row, col }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) return callback({ success: false, error: 'Nao e sua vez de dar dica' });
      const cell = room.grid[row][col];
      if (cell.revealed) return callback({ success: false, error: 'Celula ja foi revelada' });
      room.currentClue = { row, col, rowWord: cell.rowWord, colWord: cell.colWord };
      io.to(room.code).emit('clue-cell-selected', { row, col, clueGiver: currentPlayer.name, isClueGiver: true });
      socket.emit('clue-words', { rowWord: cell.rowWord, colWord: cell.colWord });
      callback({ success: true });
    });

    socket.on('submit-clue', ({ clue }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing' || !room.currentClue) return callback({ success: false, error: 'Sem dica ativa' });
      const currentPlayer = room.players[room.currentTurn];
      if (!currentPlayer || currentPlayer.id !== socket.id) return callback({ success: false, error: 'Nao e sua vez' });
      const { row, col } = room.currentClue;
      room.grid[row][col].clue = clue;
      room.grid[row][col].clueBy = currentPlayer.name;
      room.cluesGiven++;
      io.to(room.code).emit('clue-given', { row, col, clue, clueBy: currentPlayer.name });
      callback({ success: true });
    });

    socket.on('guess-cell', ({ row, col }, callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.state !== 'playing') return callback({ success: false, error: 'Jogo nao esta ativo' });
      const cell = room.grid[row][col];
      if (cell.revealed) return callback({ success: false, error: 'Celula ja foi revelada' });
      if (!cell.clue) return callback({ success: false, error: 'Nenhuma dica nesta celula' });
      const currentPlayer = room.players[room.currentTurn];
      if (currentPlayer && currentPlayer.id === socket.id) return callback({ success: false, error: 'Quem deu a dica nao pode adivinhar' });
      const guessCorrect = (row === room.currentClue.row && col === room.currentClue.col);
      if (guessCorrect) {
        cell.revealed = true;
        cell.revealedBy = socket.id;
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
        room.currentClue = null;
        io.to(room.code).emit('cell-revealed', { row, col, revealedBy: socket.id, playerName: room.players.find(p => p.id === socket.id)?.name, rowWord: cell.rowWord, colWord: cell.colWord, score: room.scores[socket.id] });
        if (checkAllRevealed(room)) {
          room.state = 'finished';
          io.to(room.code).emit('game-finished', getRoomState(room));
        } else {
          room.currentTurn = (room.currentTurn + 1) % room.players.length;
          io.to(room.code).emit('turn-changed', { currentTurn: room.currentTurn, currentPlayer: room.players[room.currentTurn]?.name });
        }
        callback({ success: true, correct: true });
      } else {
        const clueRow = room.currentClue.row;
        const clueCol = room.currentClue.col;
        room.grid[clueRow][clueCol].clue = null;
        room.grid[clueRow][clueCol].clueBy = null;
        room.currentClue = null;
        io.to(room.code).emit('wrong-guess', { row, col, clueRow, clueCol, guessedBy: socket.id, playerName: room.players.find(p => p.id === socket.id)?.name });
        room.currentTurn = (room.currentTurn + 1) % room.players.length;
        io.to(room.code).emit('turn-changed', { currentTurn: room.currentTurn, currentPlayer: room.players[room.currentTurn]?.name });
        callback({ success: true, correct: false });
      }
    });

    socket.on('restart-game', async (callback) => {
      const room = rooms.get(socket.roomCode);
      if (!room || room.host !== socket.id) return callback({ success: false, error: 'Apenas o host pode reiniciar' });
      await ensureWords();
      const { rows, cols, grid } = createGrid(WORD_LISTS[room.difficulty] || WORD_LISTS.medio, room.gridSize);
      room.rows = rows; room.cols = cols; room.grid = grid;
      room.state = 'playing'; room.currentTurn = 0; room.cluesGiven = 0; room.currentClue = null;
      Object.keys(room.scores).forEach(k => { room.scores[k] = 0; });
      io.to(room.code).emit('game-restarted', getRoomState(room));
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      const roomCode = socket.roomCode;
      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;
      const disconnectedPlayer = room.players.find(p => p.id === socket.id);
      room.players = room.players.filter(p => p.id !== socket.id);
      delete room.scores[socket.id];
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
        io.to(roomCode).emit('player-left', { playerName: disconnectedPlayer?.name, room: getRoomState(room) });
      }
      console.log(`Jogador desconectado: ${socket.id}`);
    });
  });

  // Next.js handler for all other routes
  server.all('*', (req, res) => handle(req, res));

  const PORT = process.env.PORT || 3000;

  httpServer.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`  Entre Linhas Online (Next.js)`);
    console.log(`  Rodando em http://localhost:${PORT}`);
    console.log(`=================================`);
  });
});
