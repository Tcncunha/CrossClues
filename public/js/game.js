const socket = io();

let currentPlayer = null;
let currentRoom = null;
let isMyTurn = false;
let selectedClueCell = null;

const screens = {
  menu: document.getElementById('screen-menu'),
  config: document.getElementById('screen-config'),
  lobby: document.getElementById('screen-lobby'),
  game: document.getElementById('screen-game'),
  gameover: document.getElementById('screen-gameover')
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function showError(elementId, msg) {
  const el = document.getElementById(elementId);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function getMyIndex() {
  if (!currentRoom || !currentPlayer) return -1;
  return currentRoom.players.findIndex(p => p.id === socket.id);
}

function isClueGiver() {
  if (!currentRoom) return false;
  return currentRoom.currentTurn === getMyIndex();
}

document.getElementById('btn-show-join').addEventListener('click', () => {
  document.getElementById('join-section').classList.toggle('hidden');
});

document.getElementById('btn-create-room').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) return showError('menu-error', 'Digite seu nome');
  showScreen('config');
});

document.getElementById('btn-confirm-create').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  const gridSize = parseInt(document.querySelector('input[name="grid-size"]:checked').value);
  
  socket.emit('create-room', { playerName: name, difficulty, gridSize }, (res) => {
    if (res.success) {
      currentRoom = res.room;
      currentPlayer = res.player;
      enterLobby();
    } else {
      showError('menu-error', res.error);
    }
  });
});

document.getElementById('btn-join-room').addEventListener('click', () => {
  const name = document.getElementById('player-name').value.trim();
  const code = document.getElementById('room-code-input').value.trim();
  if (!name) return showError('menu-error', 'Digite seu nome');
  if (!code || code.length !== 4) return showError('menu-error', 'Código deve ter 4 dígitos');
  
  socket.emit('join-room', { roomCode: code, playerName: name }, (res) => {
    if (res.success) {
      currentRoom = res.room;
      currentPlayer = res.player;
      enterLobby();
    } else {
      showError('menu-error', res.error);
    }
  });
});

document.getElementById('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText(currentRoom.code);
  const btn = document.getElementById('btn-copy-code');
  btn.textContent = '✅';
  setTimeout(() => btn.textContent = '📋', 1500);
});

document.getElementById('btn-start-game').addEventListener('click', () => {
  socket.emit('start-game', (res) => {
    if (!res.success) alert(res.error);
  });
});

function enterLobby() {
  showScreen('lobby');
  updateLobby();
}

function updateLobby() {
  if (!currentRoom) return;
  
  document.getElementById('lobby-room-code').textContent = currentRoom.code;
  document.getElementById('player-count').textContent = currentRoom.players.length;
  
  const ul = document.getElementById('players-ul');
  ul.innerHTML = '';
  currentRoom.players.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-dot" style="background:${p.color}"></span>
      <span class="player-name">${p.name}</span>
      ${p.isHost ? '<span class="player-host-badge">HOST</span>' : ''}
    `;
    ul.appendChild(li);
  });
  
  const isHost = currentRoom.host === socket.id;
  const btnStart = document.getElementById('btn-start-game');
  const waitingMsg = document.getElementById('waiting-msg');
  
  if (isHost) {
    btnStart.classList.remove('hidden');
    waitingMsg.classList.add('hidden');
    btnStart.disabled = currentRoom.players.length < 2;
  } else {
    btnStart.classList.add('hidden');
    waitingMsg.classList.remove('hidden');
  }
}

function enterGame(room) {
  showScreen('game');
  currentRoom = room;
  selectedClueCell = null;
  
  document.getElementById('game-room-code').textContent = `Sala: ${room.code}`;
  updateTurnIndicator();
  renderScores();
  renderGameBoard();
}

function updateTurnIndicator() {
  const el = document.getElementById('game-turn');
  const player = currentRoom.players[currentRoom.currentTurn];
  if (player) {
    const isMe = player.id === socket.id;
    el.textContent = isMe ? 'Sua vez!' : `Turno de: ${player.name}`;
    el.style.color = player.color;
  }
}

function renderScores() {
  const container = document.getElementById('game-scores');
  container.innerHTML = '';
  
  currentRoom.players.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'score-chip' + (i === currentRoom.currentTurn ? ' active' : '');
    chip.innerHTML = `
      <span class="score-dot" style="background:${p.color}"></span>
      <span>${p.name}</span>
      <span class="score-value">${currentRoom.scores[p.id] || 0}</span>
    `;
    container.appendChild(chip);
  });
}

function renderGameBoard() {
  const amClueGiver = isClueGiver();
  const hasActiveClue = currentRoom.currentClue != null;
  const waitingForSelection = amClueGiver && !hasActiveClue && !selectedClueCell;
  const waitingForClueInput = amClueGiver && !hasActiveClue && selectedClueCell != null;

  document.getElementById('clue-panel').classList.add('hidden');
  document.getElementById('guess-panel').classList.add('hidden');
  
  const cluePanel = document.getElementById('clue-panel');
  const guessPanel = document.getElementById('guess-panel');
  
  if (waitingForSelection) {
    cluePanel.classList.remove('hidden');
    document.getElementById('clue-words-display').textContent = 'Clique em uma célula vazia para escolher';
    document.getElementById('clue-instruction').style.display = 'none';
    document.getElementById('clue-input-row').style.display = 'none';
  } else if (waitingForClueInput) {
    cluePanel.classList.remove('hidden');
    document.getElementById('clue-words-display').textContent =
      `${selectedClueCell.rowWord} × ${selectedClueCell.colWord}`;
    document.getElementById('clue-instruction').style.display = '';
    document.getElementById('clue-input-row').style.display = '';
    document.getElementById('clue-input').focus();
  } else if (!amClueGiver && hasActiveClue) {
    guessPanel.classList.remove('hidden');
    document.getElementById('guess-clue-text').textContent = currentRoom.currentClue.clue;
    document.getElementById('guess-clue-by').textContent = `Dica de: ${currentRoom.currentClue.clueBy}`;
  }
  
  renderBoard('game-board');
}

function renderBoard(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const { grid, rows, cols } = currentRoom;
  const size = rows.length;
  
  if (containerId === 'game-board') {
    container.style.gridTemplateColumns = `minmax(55px, 80px) repeat(${size}, minmax(65px, 80px))`;
  }
  
  const emptyTop = document.createElement('div');
  emptyTop.className = 'board-cell cell-empty';
  container.appendChild(emptyTop);
  
  cols.forEach(word => {
    const cell = document.createElement('div');
    cell.className = 'board-cell cell-header';
    cell.textContent = word;
    container.appendChild(cell);
  });
  
  const amClueGiver = isClueGiver();
  const hasActiveClue = currentRoom.currentClue != null;
  const waitingForSelection = amClueGiver && !hasActiveClue;
  
  for (let i = 0; i < size; i++) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'board-cell cell-header';
    rowHeader.textContent = rows[i];
    container.appendChild(rowHeader);
    
    for (let j = 0; j < size; j++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell cell-game';
      cell.dataset.row = i;
      cell.dataset.col = j;
      
      const cellData = grid[i][j];
      
      if (cellData.revealed) {
        cell.classList.add('revealed');
        cell.innerHTML = `
          <span class="cell-revealed-words">${cellData.rowWord} × ${cellData.colWord}</span>
        `;
      } else if (cellData.clue) {
        cell.innerHTML = `
          <span class="cell-clue">${cellData.clue}</span>
        `;
        
        if (!amClueGiver || !waitingForSelection) {
          if (!amClueGiver && hasActiveClue) {
            cell.classList.add('clickable');
            cell.addEventListener('click', () => onCellGuess(i, j));
          }
        }
      } else {
        if (waitingForSelection) {
          cell.classList.add('clickable');
          cell.addEventListener('click', () => onCellSelect(i, j));
        }
      }
      
      if (hasActiveClue && currentRoom.currentClue.row === i && currentRoom.currentClue.col === j) {
        cell.classList.add('clue-active');
      }
      
      container.appendChild(cell);
    }
  }
}

function onCellSelect(row, col) {
  const cellData = currentRoom.grid[row][col];
  if (cellData.revealed) return;
  if (cellData.clue) return;
  
  selectedClueCell = { row, col, rowWord: cellData.rowWord, colWord: cellData.colWord };
  
  socket.emit('select-clue-cell', { row, col }, (res) => {
    if (!res.success) {
      alert(res.error);
      selectedClueCell = null;
      return;
    }
    renderGameBoard();
  });
}

function onCellGuess(row, col) {
  if (isClueGiver()) return;
  if (!currentRoom.currentClue) return;
  
  const cellData = currentRoom.grid[row][col];
  if (cellData.revealed) return;
  if (!cellData.clue) return;
  
  socket.emit('guess-cell', { row, col }, (res) => {
    if (!res.success) {
      alert(res.error);
      return;
    }
    
    if (res.correct) {
      showResultModal('✅', 'Correto!', `Acertou! +1 ponto`);
    } else {
      const cellEl = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cellEl) {
        cellEl.classList.add('wrong');
        setTimeout(() => cellEl.classList.remove('wrong'), 500);
      }
      showResultModal('❌', 'Errou!', 'Essa não era a posição correta');
    }
  });
}

document.getElementById('btn-submit-clue').addEventListener('click', () => {
  const clue = document.getElementById('clue-input').value.trim();
  if (!clue) return;
  
  socket.emit('submit-clue', { clue }, (res) => {
    if (res.success) {
      document.getElementById('clue-input').value = '';
      selectedClueCell = null;
    } else {
      alert(res.error);
    }
  });
});

document.getElementById('clue-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('btn-submit-clue').click();
  }
});

document.getElementById('btn-close-result').addEventListener('click', () => {
  document.getElementById('result-modal').classList.add('hidden');
});

function showResultModal(icon, title, detail) {
  document.getElementById('result-icon').textContent = icon;
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-detail').textContent = detail;
  document.getElementById('result-modal').classList.remove('hidden');
  
  setTimeout(() => {
    document.getElementById('result-modal').classList.add('hidden');
  }, 1500);
}

document.getElementById('btn-restart').addEventListener('click', () => {
  socket.emit('restart-game', (res) => {
    if (!res.success) alert(res.error);
  });
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
  socket.disconnect();
  socket.connect();
  currentRoom = null;
  currentPlayer = null;
  selectedClueCell = null;
  showScreen('menu');
});

socket.on('room-updated', (room) => {
  currentRoom = room;
  if (screens.lobby.classList.contains('active')) {
    updateLobby();
  }
});

socket.on('game-started', (room) => {
  currentRoom = room;
  enterGame(room);
});

socket.on('clue-words', (data) => {
  selectedClueCell.rowWord = data.rowWord;
  selectedClueCell.colWord = data.colWord;
  renderGameBoard();
});

socket.on('clue-given', (data) => {
  currentRoom.grid[data.row][data.col].clue = data.clue;
  currentRoom.grid[data.row][data.col].clueBy = data.clueBy;
  currentRoom.currentClue = data;
  currentRoom.cluesGiven++;
  selectedClueCell = null;
  
  renderGameBoard();
});

socket.on('cell-revealed', (data) => {
  currentRoom.grid[data.row][data.col].revealed = true;
  currentRoom.grid[data.row][data.col].revealedBy = data.revealedBy;
  currentRoom.scores[data.revealedBy] = data.score;
  currentRoom.currentClue = null;
  
  renderScores();
  renderGameBoard();
});

socket.on('wrong-guess', (data) => {
  currentRoom.grid[data.clueRow][data.clueCol].clue = null;
  currentRoom.grid[data.clueRow][data.clueCol].clueBy = null;
  currentRoom.currentClue = null;
  
  const cellEl = document.querySelector(`[data-row="${data.row}"][data-col="${data.col}"]`);
  if (cellEl) {
    cellEl.classList.add('wrong');
    setTimeout(() => cellEl.classList.remove('wrong'), 500);
  }
  
  showResultModal('❌', 'Errou!', 'Dica descartada. Próximo jogador!');
  
  setTimeout(() => {
    renderGameBoard();
  }, 1200);
});

socket.on('turn-changed', (data) => {
  currentRoom.currentTurn = data.currentTurn;
  currentRoom.currentClue = null;
  selectedClueCell = null;
  
  updateTurnIndicator();
  renderScores();
  renderGameBoard();
});

socket.on('game-finished', (room) => {
  currentRoom = room;
  showGameOver(room);
});

socket.on('game-restarted', (room) => {
  currentRoom = room;
  enterGame(room);
});

socket.on('player-left', (data) => {
  currentRoom = data.room;
  
  if (screens.lobby.classList.contains('active')) {
    updateLobby();
  } else if (screens.game.classList.contains('active')) {
    updateTurnIndicator();
    renderScores();
    renderGameBoard();
  }
});

function showGameOver(room) {
  showScreen('gameover');
  
  const sorted = room.players
    .map(p => ({ ...p, score: room.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);
  
  const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  
  const scoresEl = document.getElementById('final-scores');
  scoresEl.innerHTML = sorted.map((p, i) => `
    <div class="final-score-item">
      <span class="final-rank">${ranks[i]}</span>
      <span class="final-score-name">${p.name}</span>
      <span class="final-score-points">${p.score} pts</span>
    </div>
  `).join('');
  
  const finalBoard = document.getElementById('final-board');
  finalBoard.style.gridTemplateColumns = `minmax(55px, 80px) repeat(${room.gridSize}, minmax(65px, 80px))`;
  
  finalBoard.innerHTML = '';
  
  const emptyTop = document.createElement('div');
  emptyTop.className = 'board-cell cell-empty';
  finalBoard.appendChild(emptyTop);
  
  room.cols.forEach(word => {
    const cell = document.createElement('div');
    cell.className = 'board-cell cell-header';
    cell.textContent = word;
    finalBoard.appendChild(cell);
  });
  
  for (let i = 0; i < room.gridSize; i++) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'board-cell cell-header';
    rowHeader.textContent = room.rows[i];
    finalBoard.appendChild(rowHeader);
    
    for (let j = 0; j < room.gridSize; j++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell cell-game revealed';
      
      const cellData = room.grid[i][j];
      if (cellData.clue) {
        cell.innerHTML = `
          <span class="cell-clue">${cellData.clue}</span>
          <span class="cell-revealed-words">${cellData.rowWord} × ${cellData.colWord}</span>
        `;
      } else {
        cell.innerHTML = `<span class="cell-revealed-words">${cellData.rowWord} × ${cellData.colWord}</span>`;
      }
      
      finalBoard.appendChild(cell);
    }
  }
  
  if (room.host === socket.id) {
    document.getElementById('btn-restart').classList.remove('hidden');
  } else {
    document.getElementById('btn-restart').classList.add('hidden');
  }
}
