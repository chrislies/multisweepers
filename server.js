const { send } = require("process");

let clients = {};
let games = {};

const http = require("http").createServer().listen(8080, console.log("Listening on port 8080"));
const server = require("websocket").server;
const socket = new server({"httpServer":http});

socket.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  const clientId = generateClientId();
  clients[clientId] = { 
    "connection": connection 
  };
  connection.send(JSON.stringify({
    "method": "connected",
    "clientId": clientId
  }));
  sendAvailableGames();
  connection.on("message", messageHandler);
});



function messageHandler(message) {
  const msg = JSON.parse(message.utf8Data);
  let localPlayer = {};
  switch (msg.method) {
    case "instantiate":
      console.log("server.js, case 'instantiate'")
      player = {
        "clientId" : msg.clientId,
        "wins" : 0,
        "oopsies" : 0
      }
      const gameId = generateGameId();
      games[gameId] = {
        "gameId": gameId,
        "players": [player],

      }
      const payLoad = {
        "method": "instantiated",
        "game": games[gameId]
      }
      clients[msg.clientId].connection.send(JSON.stringify(payLoad));
      sendAvailableGames();
      break;
  }
}

function sendAvailableGames() {
  const gamesList = [];
  for (const game in games) {
    if (games[game].players.length < 2) {
      gamesList.push(game);
    }
  }
  for(const client in clients) {
    clients[client].connection.send(JSON.stringify({
      "method" : "gamesList",
      "list" : gamesList
    }));
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
