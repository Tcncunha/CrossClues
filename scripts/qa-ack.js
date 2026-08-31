// Minimal socket.io async+ack sanity test using project's socket.io 4.8.3
const http = require('http');
const { Server } = require('./node_modules/socket.io');
const { io } = require('./node_modules/socket.io-client');
const PORT = 4100;
const httpServer = http.createServer();
const sio = new Server(httpServer);
sio.on('connection', (socket) => {
  socket.on('sync-ack', (cb) => { cb({ ok: true }); });
  socket.on('async-ack', async (cb) => {
    await new Promise(r => setTimeout(r, 50));
    cb({ ok: true, async: true });
  });
  socket.on('async-ack-payload', async (data, cb) => {
    await new Promise(r => setTimeout(r, 50));
    cb({ ok: true, got: data });
  });
});
httpServer.listen(PORT);
const client = io(`http://localhost:${PORT}`, { transports: ['websocket'] });
client.on('connect', async () => {
  const sync = await new Promise(r => client.emit('sync-ack', r));
  console.log('sync-ack result:', JSON.stringify(sync));
  const asyncr = await new Promise(r => client.emit('async-ack', r));
  console.log('async-ack result:', JSON.stringify(asyncr));
  const asyncp = await new Promise(r => client.emit('async-ack-payload', { x: 1 }, r));
  console.log('async-ack-payload result:', JSON.stringify(asyncp));
  // see if there were any ack timeouts
  setTimeout(async () => {
    const again = await new Promise(r => client.emit('async-ack', r));
    console.log('async-ack (2nd) result:', JSON.stringify(again));
    client.close(); sio.close(); httpServer.close(); process.exit(0);
  }, 300);
});
process.on('unhandledRejection', (e) => console.log('UHR:', e.message));
