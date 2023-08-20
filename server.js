const { connection } = require("websocket");

const http = require("http").createServer().listen(8080, console.log("Listening on port 8080"));
const server = require("websocket").server;
const socket = new server({ "httpServer": http });

let clients = {};
let games = {};

socket.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  connection.on("open", connectionOpened)
  connection.on("close", () => {});
  connection.on("message", messageHandler);
  
  const clientId = generateClientId();
  clients[clientId] = { "connection": connection };
  connection.send(JSON.stringify({
    "method": "connected",
    "clientId": clientId
  }));
});

function connectionOpened() {
  connection.send("Connection with server opened");
}

function messageHandler(message) {
  const msg = JSON.parse(message.utf8Data);
  let localPlayer = {};
  switch (msg.method) {
    case "instantiate":
      localPlayer = {
        "clientId" : msg.clientId,
        "wins" : 0,
        "oopsies" : 0
      }
      const gameId = generateGameId;
      games[gameId] = {
        "gameId": gameId,
        "players": Array(localPlayer),

      }

  }
}

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
  console.log(`Client id: ${id}`);
  return id;
}

function generateGameId() {
  let id = "";
  const data = "0123456789";
  for (let i = 0; i < 4; i++) {
    id += data.charAt(Math.floor(Math.random() * data.length));
  }
  console.log(`Game id: ${id}`);
  // const serverCode = document.querySelector("#serverCode");
  // serverCode.innerText = id;
  return id;
}
