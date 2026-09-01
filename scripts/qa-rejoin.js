// QA test harness #2 — focused on rejoin bug + rule validations
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
function connect(name) {
  return new Promise((resolve, reject) => {
    const s = io(URL, { transports: ['websocket'], reconnection: false, forceNew: true });
    s.on('connect', () => resolve(s));
    s.on('connect_error', (e) => reject(e));
  });
}
function emitAck(s, evt, payload) { return new Promise((resolve) => s.emit(evt, payload, (res) => resolve(res))); }

async function run() {
  let serverProc = null;
  try {
    serverProc = spawn('node', ['server.js'], {
      cwd: PROJECT,
      env: { ...process.env, NODE_ENV: 'development', SUPABASE_URL: 'http://localhost:29999', SUPABASE_KEY: 'test', ADMIN_SECRET: 'secret123', PORT: String(PORT) },
      stdio: 'pipe',
    });
    serverProc.stdout.on('data', d => null); // quiet
    serverProc.stderr.on('data', d => process.stderr.write('[ERR] ' + d));

    let ready = false;
    for (let i = 0; i < 60; i++) {
      try { const c = await connect('probe'); c.close(); ready = true; break; } catch { await delay(1000); }
    }
    if (!ready) { console.error('Server did not start'); process.exit(2); }
    console.log('=== Server ready ===\n');

    // ===========================================================
    // REJOIN TEST — replicating EXACTLY what frontend does
    // Frontend: saveSessionToStorage(roomCode, res.player.id, name)
    //           then rejoin-room emits { playerId: savedSession.playerId }
    // Backend:  finds player by p.playerToken === playerId
    // ===========================================================
    {
      const alice = await connect('alice');
      const createRes = await emitAck(alice, 'create-room', { playerName: 'Alice', difficulty: 'easy', gridSize: 3, wordLanguage: 'EN' });
      const roomCode = createRes.room.code;
      const playerObj = createRes.player;
      console.log('[REJOIN] created room:', roomCode);
      console.log('[REJOIN] player object returned:', JSON.stringify(playerObj));
      console.log('[REJOIN] player.id (what frontend saves):', playerObj.id);
      console.log('[REJOIN] player.playerToken (what backend expects):', playerObj.playerToken);

      // Simulate the frontend: it saved player.id, not playerToken
      const savedPlayerId = playerObj.id;
      const savedPlayerName = playerObj.name;

      // Alice disconnects
      alice.close();
      await delay(500);
      console.log('[REJOIN] Alice disconnected. Attempting rejoin quickly (within grace).');

      // New connection (like a reconnecting socket), but frontend sends savedPlayerId = player.id
      const alice2 = await connect('alice2');
      const rejoinRes = await emitAck(alice2, 'rejoin-room', { roomCode, playerId: savedPlayerId, playerName: savedPlayerName });
      record('US-009-REJOIN', 'Rejoin using saved player.id succeeds',
             'success=true (player found)', JSON.stringify(rejoinRes),
             rejoinRes && rejoinRes.success === true);

      // Now test the CORRECT way (frontend SHOULD send playerToken)
      const alice3 = await connect('alice3');
      const rejoinRes2 = await emitAck(alice3, 'rejoin-room', { roomCode, playerId: playerObj.playerToken, playerName: savedPlayerName });
      record('US-009-REJOIN-TOKEN', 'Rejoin using playerToken (correct contract) succeeds',
             'success=true', JSON.stringify(rejoinRes2),
             rejoinRes2 && rejoinRes2.success === true);

      alice2.close(); alice3.close();
      await delay(300);
    }

    // ===========================================================
    // US-010: empty room cleanup after grace
    // ===========================================================
    {
      const c = await connect('rooma');
      const cr = await emitAck(c, 'create-room', { playerName: 'X', difficulty: 'easy', gridSize: 3, wordLanguage: 'EN' });
      const rc = cr.room.code;
      c.close();
      await delay(35000); // >30s grace
      const c2 = await connect('rooma2');
      const joinRes = await emitAck(c2, 'join-room', { roomCode: rc, playerName: 'Y' });
      record('US-010-CLEAN', 'Empty room cleaned after grace (join fails)', 'success=false', JSON.stringify(joinRes), joinRes && !joinRes.success);
      c2.close();
    }

    console.log('\n=== done ===');
  } catch (e) { console.error('CRASH', e); }
  finally { if (serverProc) serverProc.kill(); }
  const fails = results.filter(r => !r.ok);
  console.log(`\nTOTAL: ${results.length}  PASS: ${results.length - fails.length}  FAIL: ${fails.length}`);
  process.exit(fails.length ? 1 : 0);
}
run();
