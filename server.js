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
    "serverId": serverId,
    "players": players
  }
  connection.send(JSON.stringify({
    "method": "connected",
    "clientId": clientId,
    "serverId": serverId,
    "username": username,
    "playerCount": Object.keys(servers[serverId].players).length
  }));
  sendAvailableServers(); // from servers table, filter out servers player can join and send to all clients
  connection.on("message", onMessage);

  // Handle client disconnect
  connection.on("close", (reasonCode, description) => {
    console.log(`Client ${clientId} disconnected. Reason: ${description}`);
    // remove client from the server
    if (serverId && clientId) {
      removePlayerFromServer(serverId, clientId);
    }
    // remove client from the clients object
    delete clients[clientId];
    // update and send available servers to clients
    sendAvailableServers();
  });
});

function onMessage(message) {
  const data = JSON.parse(message.utf8Data);
  let localPlayer = {};
  switch (data.method) {
    case "instantiate":
      console.log("server.js, case 'instantiate'")
      player = {
        "clientId" : data.clientId,
        "wins" : 0,
        "oofs" : 0
      }
      const serverId = generateServerId();
      servers[serverId] = {
        "serverId": serverId,
        "players": [player],

      }
      const payLoad = {
        "method": "instantiated",
        "server": servers[serverId]
      }
      clients[data.clientId].connection.send(JSON.stringify(payLoad));
      sendAvailableServers();
      break;
    case "joinServer":
      if (servers[data.serverId]) {  // Server exists
        // Prevent user from joining own's server
        let alreadyInServer = false;
        for (const p of servers[data.serverId].players) {
          if (p.clientId == data.clientId) {  
            alreadyInServer = true;
            clients[data.clientId].connection.send(JSON.stringify({
              "method": "alreadyInServer",
              "serverId": data.serverId
            }));
            break; // Exit the loop
          }
        }
        if (alreadyInServer) {  // If already in the server, don't continue further
          break; // Exit the switch block
        }
        player = {
          "clientId": data.clientId,
          "username": data.username,
          "wins": 0,
          "oofs": 0
        }
        servers[data.serverId].players.push(player);
        sendAvailableServers();   // update and remove the server from the serversList since server is now full
        servers[data.serverId].players.forEach(player => {
          clients[player.clientId].connection.send(JSON.stringify({
            "method": "joinedServer",
            "serverId": data.serverId,
            "username": data.username,
            "playerCount": Object.keys(servers[data.serverId].players).length
          }));
        });
      } else {
        // Server DNE!
        clients[data.clientId].connection.send(JSON.stringify({
          "method": "serverDNE",
          "serverId": data.serverId
        }));
      }
      break;
  }
}

function sendAvailableServers() {
  // for each client, send them this servers array
  // only send servers that do not have two players
  const serversList = [];
  for (const serverId in servers) {
    if (servers[serverId].players.length < 2) {
      serversList.push(serverId);
    } 
  }
  for(const client in clients) {
    clients[client].connection.send(JSON.stringify({
      "method" : "updateServersList",
      "list" : serversList
    }));
  }
}
 
function removePlayerFromServer(serverId, clientId) {
  if (servers[serverId]) {
    servers[serverId].players = servers[serverId].players.filter(player => player.clientId !== clientId);
    if (servers[serverId].players.length === 0) { // delete server if empty
      delete servers[serverId];
    } else if (servers[serverId].players.length === 1) {  // server has one player; update playerCount
      for(const client in clients) {
        clients[client].connection.send(JSON.stringify({
          "method": "updatePlayerCount",
          "playerCount": Object.keys(servers[serverId].players).length
        }));
      }
    }
  }
}

function generateName() {
  const adjectives = ["Joyful","Samurai","Warrior","Friendly","Cheerful","Delightful","Hungry","Ninja","Silly","Wonderful","Fantastic","Amazing","Enthusiastic","Trusting","Courageous","Optimistic","Talented","Funny","Hopeful","Charismatic","Genuine","Creative","Confident","Radiant","Splendid","Harmonious","Intelligent","Dynamic","Vibrant","Brilliant","Excited","Jubilant","Awesome","Happy","Strong","Brave","Witty","Charming","Eager","Caring","Lucky","Jovial","Honest","Polite","Fearless","Sincere","Ecstatic","Zealous","Earnest","Relaxed","Mindful","Energetic"]
  const animals = ["Serpent","Hippo","Giraffe","Bunny","Turtle","Tortoise","Rabbit","Mouse","Cat","Tiger","Puppy","Lion","Elephant","Dolphin","Koala","Cheetah","Panda","Gorilla","Penguin","Flamingo","Zebra","Lemur","Sloth","Ostrich","Raccoon","Meerkat","Peacock","Hyena","Monkey","Capybara","Goose"]
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
  // console.log(`Client id: ${id}`);
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
  // console.log(`Server id: ${id}`);
  return id;
}