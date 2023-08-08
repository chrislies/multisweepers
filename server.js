const http = require("http").createServer().listen(8080, console.log("Listening on port 8080"));
const server = require("websocket").server;
const socket = new server({ "httpServer": http });

let clients = {};
let games = {};

socket.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  const clientId = generateClientId();
  clients[clientId] = { "connection": connection };
  connection.send(JSON.stringify({
    "tag": "connected",
    "clientId": clientId
  }));
  sendPlayerCount();
});

function sendPlayerCount() {
  let totalPlayers = Object.keys(clients).length;
  Object.keys(clients).forEach((client) => {
    clients[client].connection.send(JSON.stringify({
      "tag": "playerCount",
      "count": totalPlayers
    }));
  });

}


function generateClientId() {
  let id = "";
  const data = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 10; i++) {
    id += data.charAt(Math.floor(Math.random() * data.length));
  }
  console.log(id);
  return id;
}