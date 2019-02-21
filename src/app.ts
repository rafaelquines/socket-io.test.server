import * as SocketIO from "socket.io";

const port = 5000;
const socketServer = SocketIO(port);
let connections = 0;
const web: string[] = [];
const worker = {};
console.log(`Server listening on port ${port}`);
socketServer.on("connection", connection);

function connection(socket: SocketIO.Socket) {
  connections++;
  console.log("[" + socket.id + "] CONNECTED. (" + connections + ")");
  socket.on("disconnect", () => disconnect(socket));
  socket.on("error", onError);

  socket.on("register", (type) => register(socket, type));
  socket.on("update_status", (data) => updateStatus(socket, data));
  socket.on("init_sync", (data) => initSync(socket, data));
  socket.on("update_sync", (data) => updateSync(socket, data));
}

interface WorkerData {
  id: string;
  status: "IDLE" | 'WORKING';
  shopId: number;
  progress: number;
}

function register(socket: SocketIO.Socket, type: string) {
  if(type === 'WEB') {
    socket.join(type);
    web.push(socket.id);
    console.log("Emitting list workers");
    socket.emit('list_workers', worker);
  } else {
    console.log("NEW WORKER: " + socket.id);
    worker[socket.id] = { id: socket.id, status: "IDLE", shopId: 0, progress: 0};
    socket.to('WEB').emit('worker_added', worker[socket.id]);

  }
}

function onError(err) {
  console.error(err);
}

function disconnect(socket: SocketIO.Socket) {
  connections--;
  console.log("[" + socket.id + "] DISCONNECTED. (" + connections + ")");
  const indexOfWeb = web.indexOf(socket.id);
  if(indexOfWeb !== -1) {
    web.splice(indexOfWeb, 1);
  } else {
    console.log("REMOVED WORKER: " + socket.id);
    socket.to('WEB').emit("worker_disconnect", worker[socket.id]);
    delete worker[socket.id];
    // worker.splice(worker.indexOf(socket.id), 1);
  }
}

function updateStatus(socket: SocketIO.Socket, status: string) {
  console.log("[" + socket.id + "] STATUS: " + status);
  worker[socket.id].status = status;
  socket.to('WEB').emit('update_status', worker[socket.id]);
}

function initSync(socket: SocketIO.Socket, data: { shopId: number, files: number }) {
  console.log("[" + socket.id + "] Init sync shopId: " + data.shopId + " files: " + data.files);
  worker[socket.id].shopId = data.shopId;
  socket.to('WEB').emit('init_sync', worker[socket.id]);
}

function updateSync(socket: SocketIO.Socket, data: { shopId: number, processedFiles: number, totalFiles: number }) {
  const perc = Math.round(data.processedFiles * 100 / data.totalFiles);
  console.log("[" + socket.id + "] Sync shopId: " + data.shopId + " files: " + data.processedFiles + "/" + data.totalFiles + " " + perc + "%");
  worker[socket.id].progress = perc;
  if(perc === 100) {
    worker[socket.id].shopId = 0;
    worker[socket.id].progress = 0;
  }
  socket.to('WEB').emit('update_sync', worker[socket.id]);
}