// Minimal minimal — just create + start
const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const PROJECT = 'C:\\PythonsCodes\\Local host\\CrossLines\\CrossClues';
const PORT = 4001; const URL = `http://localhost:${PORT}`;
function delay(ms){return new Promise(r=>setTimeout(r,ms));}
function connect(){return new Promise((res,rej)=>{const s=io(URL,{transports:['websocket'],reconnection:false,forceNew:true});s.on('connect',()=>res(s));s.on('connect_error',rej);});}
function emitAck(s,e,p){return new Promise(res=>s.emit(e,p,(r)=>res(r)));}
async function run(){
  const sp=spawn('node',['server.js'],{cwd:PROJECT,env:{...process.env,NODE_ENV:'development',SUPABASE_URL:'http://localhost:29999',SUPABASE_KEY:'t',ADMIN_SECRET:'s',PORT:String(PORT)},stdio:'pipe'});
  sp.stderr.on('data',d=>process.stdout.write('[ERR] '+d));
  sp.stdout.on('data',d=>process.stdout.write('[OUT] '+d));
  let ready=false;
  for(let i=0;i<60;i++){try{const c=await connect();c.close();ready=true;break;}catch{await delay(1000);}}
  if(!ready){console.log('not ready');process.exit(2);}
  console.log('READY');
  const host=await connect();
  const guest=await connect();
  const cr=await emitAck(host,'create-room',{playerName:'A',difficulty:'easy',gridSize:3,wordLanguage:'EN'});
  const rc=cr.room.code;
  console.log('room',rc,'hostConnected',!!cr.success);
  const jr=await emitAck(guest,'join-room',{roomCode:rc,playerName:'B'});
  console.log('join',JSON.stringify(jr.success));
  console.log('calling start-game ONCE...');
  const sr=await emitAck(host,'start-game');
  console.log('start result:',JSON.stringify(sr));
  await delay(2000);
  console.log('done waiting');
  host.close();guest.close();
  sp.kill();
  process.exit(0);
}
run();
