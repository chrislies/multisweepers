const { send } = require("process");

let clients = {};
let servers = {};

const http = require("http").createServer().listen(8080, console.log("Listening on port 8080"));
const server = require("websocket").server;
const socket = new server({"httpServer":http});

socket.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  const clientId = generateClientId();
  const serverId = generateServerId();
  const username = generateName();
  clients[clientId] = { 
    "connection": connection 
  };
  let player = {
    "clientId": clientId,
    "username": username
  }
  const players = Array(player);
  servers[serverId] = {
    "players": players
  }
  connection.send(JSON.stringify({
    "method": "connected",
    "clientId": clientId,
    "serverId": serverId,
    "username": username
  }));
  console.log("calling sendAvailableServers()");
  sendAvailableServers(); // from servers table, filter out servers player can join and send to all clients
  connection.on("message", onMessage);
});


function sendAvailableServers() {
  // for each client, send them this servers array
  // only send servers that do not have two players
  const serversList = [];
  for (const server in servers) {
    if (servers[server].players.length < 2) {
      serversList.push(server);
    }
  }
  for(const client in clients) {
    clients[client].connection.send(JSON.stringify({
      "method" : "serversList",
      "list" : serversList
    }));
  }
}


// function sendAvailableGames() {
//   const gamesList = [];
//   for (game in games) {
//     gamesList.push(games[game].gameId);
//     console.log("game:");
//     console.log(game);
//   }
//   // console.log(gamesList);
//   for(const client of Object.keys(clients)) {
//     clients[client].connection.send(JSON.stringify({
//       "method" : "gamesAvailable",
//       "games" : gamesList
//     }));
//   }
//   console.log("done w/ sendAvailableGames()");
// }

function sendPlayerCount() {
  let totalPlayers = Object.keys(clients).length;
  Object.keys(clients).forEach((client) => {
    clients[client].connection.send(JSON.stringify({
      "method": "playerCount",
      "count": totalPlayers
    }));
  });

}

function generateName() {
  const adjectives = ["Joyful","Grateful","Exciting","Friendly","Cheerful","Delightful","Hungry","Wonderful","Fantastic","Amazing","Enthusiastic","Trusting","Courageous","Optimistic","Talented","Humorous","Hopeful","Charismatic","Genuine","Creative","Confident","Radiant","Splendid","Harmonious","Intelligent","Dynamic","Vibrant","Brilliant","Excited","Jubilant","Awesome","Happy","Strong","Brave","Witty","Charming","Eager","Caring","Lucky","Jovial","Honest","Polite","Fearless","Sincere","Ecstatic","Zealous","Earnest","Relaxed","Mindful","Energetic"]
  const animals = ["Serpent","Hippo","Giraffe","Bunny","Turtle","Tortoise","Rabbit","Mouse","Cat","Tiger","Puppy","Lion","Elephant","Dolphin","Koala","Cheetah","Panda","Gorilla","Penguin","Flamingo","Zebra","Lemur","Sloth","Ostrich","Raccoon","Meerkat","Peacock","Hyena","Monkey","Capybara"]
  let name = "";
  name += adjectives[Math.floor(Math.random() * adjectives.length)] + " " + animals[Math.floor(Math.random() * animals.length)];
  return name;
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

function generateServerId() {
  let id = "";
  let temp;
  const data = "0123456789";
  // generate a 4 digit game id that does not start with zero
  while (id.length < 4) {
    temp = data.charAt(Math.floor(Math.random() * data.length));
    while (id.length == 0 && temp == 0) {
      temp = data.charAt(Math.floor(Math.random() * data.length))
    }
    id += temp;
  }
  console.log(`Server id: ${id}`);
  return id;
}

function onMessage(message) {
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
      const serverId = generateserverId();
      servers[serverId] = {
        "serverId": serverId,
        "players": [player],

      }
      const payLoad = {
        "method": "instantiated",
        "server": servers[serverId]
      }
      clients[msg.clientId].connection.send(JSON.stringify(payLoad));
      sendAvailableServers();
      break;
  }
}
