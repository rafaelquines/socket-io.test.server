import * as SocketIO from "socket.io";
import * as dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT || 5000;
const socketServer = SocketIO(port);
let connections = 0;

console.log(`Server listening on port ${port}`);
socketServer.on("connection", connection);

function connection(socket: SocketIO.Socket) {
  connections++;
  console.log("[" + socket.id + "] CONNECTED. (" + connections + ")");
  socket.on("disconnect", () => disconnect(socket));
  socket.on("error", onError);
}

function onError(err) {
  console.error(err);
}

function disconnect(socket: SocketIO.Socket) {
  connections--;
  console.log("[" + socket.id + "] DISCONNECTED. (" + connections + ")");
}
