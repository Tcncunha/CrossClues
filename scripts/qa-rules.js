// QA test harness #3 — game rule validations (US-002, US-003, US-006, US-007)
const { spawn } = require('child_process');
const { io } = require('socket.io-client');

const PROJECT = 'C:\\PythonsCodes\\Local host\\CrossLines\\CrossClues';
const PORT = 3999;
const URL = `http://localhost:${PORT}`;

const results = [];
function record(id, scenario, expected, actual, ok) {
  results.push({ id, scenario, expected, actual, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${id}] ${scenario}`);
  if (!ok) { console.log(`   expected: ${expected}`); console.log(`   actual:   ${actual}`); }
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function connect() { return new Promise((resolve, reject) => { const s = io(URL, { transports: ['websocket'], reconnection: false, forceNew: true }); s.on('connect', () => resolve(s)); s.on('connect_error', reject); }); }
function emitAck(s, evt, payload) { return new Promise((resolve) => s.emit(evt, payload, (res) => resolve(res))); }
// collect events
function onEvent(s, evt, handler) { s.on(evt, handler); }

async function run() {
  let serverProc = null;
  const seenEvents = { cellRevealed: null, turnChanged: null, wrongGuess: null };
  try {
    serverProc = spawn('node', ['server.js'], {
      cwd: PROJECT,
      env: { ...process.env, NODE_ENV: 'development', SUPABASE_URL: 'http://localhost:29999', SUPABASE_KEY: 'test', ADMIN_SECRET: 'secret123', PORT: String(PORT) },
      stdio: 'pipe',
    });
    serverProc.stderr.on('data', d => process.stderr.write('[ERR] ' + d));
    let ready = false;
    for (let i = 0; i < 60; i++) { try { const c = await connect(); c.close(); ready = true; break; } catch { await delay(1000); } }
    if (!ready) { console.error('Server did not start'); process.exit(2); }
    console.log('=== Server ready ===\n');

    // Setup room
    const host = await connect();
    const guest = await connect();
    const createRes = await emitAck(host, 'create-room', { playerName: 'Alice', difficulty: 'easy', gridSize: 3, wordLanguage: 'EN' });
    const roomCode = createRes.room.code;
    // host.id should be current turn 0
    await emitAck(guest, 'join-room', { roomCode, playerName: 'Bob' });
    const startRes = await emitAck(host, 'start-game');
    record('START-2P', 'Start game with 2 players', 'success=true', JSON.stringify(startRes), startRes && startRes.success);

    // Host (turn 0) is clue giver. Draw card.
    const drawRes = await emitAck(host, 'draw-card');
    record('DRAW-CLUE', 'Clue giver draws card', 'success=true', JSON.stringify(drawRes), drawRes && drawRes.success);
    const card = drawRes.card;

    // Clue giver selects cell = drawn card, then submits
    await emitAck(host, 'select-clue-cell', { row: card.row, col: card.col });
    const clueRes = await emitAck(host, 'submit-clue', { clue: 'forest' });
    record('CLUE-SUBMIT', 'Submit clue succeeds', 'success=true', JSON.stringify(clueRes), clueRes && clueRes.success);

    // US-007: clue giver tries to guess own clue -> blocked
    const selfGuess = await emitAck(host, 'guess-cell', { row: card.row, col: card.col });
    record('US-007-DADOR', 'Clue giver guessing own clue rejected', 'success=false', JSON.stringify(selfGuess), selfGuess && selfGuess.success === false);
    console.log('   dadador error:', selfGuess?.error);

    // US-003: group makes a guess (correct) -> success
    onEvent(host, 'cell-revealed', (d) => { seenEvents.cellRevealed = d; });
    onEvent(host, 'turn-changed', (d) => { seenEvents.turnChanged = d; });
    const correct = await emitAck(guest, 'guess-cell', { row: card.row, col: card.col });
    record('GUESS-CORRECT', 'Group correct guess succeeds', 'success=true, correct=true', JSON.stringify(correct), correct && correct.success === true && correct.correct === true);
    await delay(300);
    console.log('   cell-revealed event payload:', JSON.stringify(seenEvents.cellRevealed));
    console.log('   turn-changed event payload:', JSON.stringify(seenEvents.turnChanged));
    // US-002 contract: cell-revealed must carry teamScore
    record('CELL-REVEALED-TEAMSCORE', 'cell-revealed emits teamScore field', 'has teamScore', JSON.stringify(seenEvents.cellRevealed), seenEvents.cellRevealed && typeof seenEvents.cellRevealed.teamScore === 'number');
    // US-006: turn advanced (0->1)
    record('TURN-ADVANCED', 'Turn advanced after correct guess', 'currentTurn=1', seenEvents.turnChanged ? seenEvents.turnChanged.currentTurn : 'none', seenEvents.turnChanged && seenEvents.turnChanged.currentTurn === 1);

    // US-003: a 2nd guess on a new clue should work once, but a 2nd guess on same clue rejected.
    // Turn now = guest (Bob). Bob draws, gives clue, host guesses correct.
    const draw2 = await emitAck(guest, 'draw-card');
    if (draw2.success) {
      const card2 = draw2.card;
      await emitAck(guest, 'select-clue-cell', { row: card2.row, col: card2.col });
      await emitAck(guest, 'submit-clue', { clue: 'ocean' });
      const g1 = await emitAck(host, 'guess-cell', { row: card2.row, col: card2.col });
      record('GUESS-CORRECT2', '2nd correct guess succeeds', 'success', JSON.stringify(g1), g1.success === true && g1.correct === true);
    }

    console.log('\n=== done with rules ===');
    host.close(); guest.close();
  } catch (e) { console.error('CRASH', e); }
  finally { if (serverProc) serverProc.kill(); }
  const fails = results.filter(r => !r.ok);
  console.log(`\nTOTAL: ${results.length}  PASS: ${results.length - fails.length}  FAIL: ${fails.length}`);
  process.exit(fails.length ? 1 : 0);
}
run();
