const { send } = require("process");
const { client } = require("websocket");

let clients = {};
let servers = {};
let gameState = {};

const http = require("http").createServer().listen(8080, () => {
  console.log("Listening on port 8080");
});
const server = require("websocket").server;
const socket = new server({ httpServer: http });

socket.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  const clientId = generateClientId();
  const serverId = generateServerId();
  const username = generateName();
  let visitedTiles = [];
  let numMines = 0;
  let randomMines = [];
  let buttonFlagCounter = 0;
  let gameDifficulty = "";
  clients[clientId] = {
    clientId: clientId,
    serverId: serverId,
    username: username,
    connection: connection
  };
  servers[serverId] = {
    serverId: serverId,
    clients: [clients[clientId]],
    gameState: gameState
  };
  gameState[serverId] = {
    visitedTiles: visitedTiles,
    numMines: numMines,
    randomMines: randomMines,
    buttonFlagCounter: buttonFlagCounter,
    gameDifficulty: gameDifficulty
  }
  connection.send(
    JSON.stringify({
      method: "connected",
      clientId: clientId,
      serverId: serverId,
      username: username,
      playerCount: servers[serverId].clients.length
    })
  );
  sendAvailableServers(); // send available servers to all clients
  connection.on("message", onMessage);

  // Handle client disconnect
  connection.on("close", (reasonCode, description) => {
    const leftServerId = clients[clientId].serverId;
    console.log(`Player "${clients[clientId].username}" disconnected from server ${leftServerId}. Reason: ${description}`);
    // Find the index of the disconnected client in the server's clients array
    const clientIndex = servers[leftServerId].clients.findIndex(client => client.clientId === clientId);
    if (clientIndex !== -1) {
      // Remove the client from the server's clients array
      servers[leftServerId].clients.splice(clientIndex, 1);
      // console.log(`servers[${leftServerId}].clients.length = ${servers[leftServerId].clients.length}`);
    } else {
      console.log(`Client with ID ${clientId} not found in server ${leftServerId}`);
    }    
    delete clients[clientId];
    
    // ---------- JUST FOR CHECKING ----------
    console.log(`remaining servers:`)
    for (s in servers) {
      console.log(`servers[${s}].clients.length = ${servers[s].clients.length}`);
    }
    // ---------- JUST FOR CHECKING ----------
    const updatedPlayerList = [];
    for (const clientId in servers[leftServerId].clients) {
      const client = servers[leftServerId].clients[clientId];
      updatedPlayerList.push(client.username);
    }
    console.log(`updatedPlayerList = ${updatedPlayerList}`);
    // send the updated player list to the other client in that server
    for (const client of Object.values(clients)) {
      if (client.serverId === leftServerId) {
        client.connection.send(JSON.stringify({
          method: "updatePlayersList",
          usernameList: updatedPlayerList,
          playerCount: servers[leftServerId].clients.length
        }));
      }    
    }
    // If the server is now empty, remove it
    if (servers[serverId].clients.length === 0) {
      delete servers[serverId];
    }
    sendAvailableServers();
  });
  
});
function onMessage(message) {
  const data = JSON.parse(message.utf8Data);
  switch (data.method) {
    case "instantiate":
      console.log("server.js, case 'instantiate'");
      const player = {
        clientId: data.clientId,
        wins: 0,
        oofs: 0
      };
      const serverId = generateServerId();
      servers[serverId] = {
        serverId: serverId,
        clients: [clients[data.clientId]]
      };
      const payLoad = {
        method: "instantiated",
        server: servers[serverId]
      };
      clients[data.clientId].connection.send(JSON.stringify(payLoad));
      sendAvailableServers();
      break;
    case "joinServer":
      if (servers[data.serverId]) {  // Server exists
        // Prevent user from joining own's server
        if (clients[data.clientId].serverId === servers[data.serverId].serverId) {
          clients[data.clientId].connection.send(JSON.stringify({
          "method": "alreadyInServer",
          "serverId": data.serverId
          }))
          break;
        }

        // Prevent user from joining a full server
        if (servers[data.serverId].clients.length === 2) {
          if (clients[data.clientId]) {
            clients[data.clientId].connection.send(JSON.stringify({
              "method": "serverIsFull",
              "serverId": data.serverId
            }));
          }
          break;
        }
        
        // update client's serverId with new server
        // const oldServerId = clients[data.clientId].serverId;
        servers[data.oldServerId].clients.length -= 1;
        clients[data.clientId].serverId = data.serverId;

        console.log(`${data.username} left server ${data.oldServerId} to join server ${data.serverId}`);

        // const client = {
        //   "clientId": data.clientId,
        //   "username": data.username,
        //   "wins": 0,
        //   "oofs": 0,
        //   "connection": clients[data.clientId].connection // Get the client's connection
        // };
        // servers[data.serverId].clients.push(client);

        servers[data.serverId].clients.push(clients[data.clientId]);

        // create a usernameList array for the current server
        const usernameList = [];
        for (const client in clients) {
          if (clients[client].serverId === data.serverId) {
            usernameList.push(clients[client].username);
          }
        }
        console.log(`usernameList for server ${data.serverId} = ${usernameList}`);

        for (const clientId in clients) {
          if (clients[clientId].serverId === data.serverId) {
            clients[clientId].connection.send(JSON.stringify({
              "method": "joinedServer",
              "serverId": data.serverId,
              "playerCount": Object.keys(servers[data.serverId].clients).length,
              "usernameList": usernameList,
              "player": clients[data.clientId].username
            }));
          }
        }

        // update the usernames for the old server
        const updatedPlayerList = [];
        for (const clientId in clients) {
          if (clients[clientId].serverId === data.oldServerId) {
            updatedPlayerList.push(clients[clientId].username);
          }
        }
        console.log(`updatedPlayerList for server ${data.oldServerId} = ${updatedPlayerList}`);
        // send the updated player list to the other client in that server
        for (const clientId in clients) {
          if (clients[clientId].serverId === data.oldServerId) {
            clients[clientId].connection.send(JSON.stringify({
              method: "updatePlayersList",
              updatedPlayerList: updatedPlayerList,
              playerCount: servers[data.oldServerId].clients.length
            }))
          }
        }
        sendAvailableServers();   // update and remove the server from the serversList since server is now full
      } else {
        // Server DNE!
        if (clients[data.clientId]) {
          clients[data.clientId].connection.send(JSON.stringify({
            "method": "serverDNE",
            "serverId": data.serverId
          }));
        }
      }
      break;
    case "updateGameState":
      // update gameState to server.js
      gameState[data.serverId].visitedTiles = data.gameState.visitedTiles;
      gameState[data.serverId].numMines = data.gameState.numMines;
      gameState[data.serverId].randomMines = data.gameState.randomMines;
      gameState[data.serverId].buttonFlagCounter = data.gameState.buttonFlagCounter;
      gameState[data.serverId].gameDifficulty = data.gameState.gameDifficulty; 
      // console.log(`Server ${data.serverId} gameState = ${gameState[data.serverId].visitedTiles}`);

      // send server info to its clients 
      for (const client in clients) {
        if (clients[client].serverId === data.serverId && clients[client].clientId !== data.clientId) {
          const otherClient = clients[client];
          otherClient.connection.send(JSON.stringify({
            "method": "updateGameState",
            "otherClient": otherClient.username,
            "tiles": data.gameState.tiles,
            "visitedTiles": data.gameState.visitedTiles,
            "numMines": data.gameState.numMines,
            "randomMines": data.gameState.randomMines,
            "buttonFlagCounter": data.gameState.buttonFlagCounter,
            "gameDifficulty": data.gameState.gameDifficulty
          }));
        }
      }
      break;
    case "updateGameStateForPlayerJoining":
      // update gameState to server.js
      // send server info to the player joining the server 
      clients[data.clientId].connection.send(JSON.stringify({
        "method": "updateGameStateForPlayerJoining",
        "visitedTiles": gameState[data.serverId].visitedTiles,
        "numMines": gameState[data.serverId].numMines,
        "randomMines": gameState[data.serverId].randomMines,
        "buttonFlagCounter": gameState[data.serverId].buttonFlagCounter,
        "gameDifficulty": gameState[data.serverId].gameDifficulty
      }));
      break;
    }
}

function sendAvailableServers() {
  // Create a list of available servers with player counts
  const serversList = [];
  console.log("Servers online:");
  for (const serverId in servers) {
    if (servers[serverId].clients.length !== 0) {
      console.log(`serverId = ${serverId}`);
      serversList.push({
        serverId: serverId,
        playerCount: servers[serverId].clients.length
      });
    }
  }
  console.log("------------------");
  for (const clientId in clients) {
    clients[clientId].connection.send(
      JSON.stringify({
        method: "updateServersList",
        list: serversList
      })
    );
  }
}

function generateName() {
  const adjectives = ["Joyful","Samurai","Warrior","Friendly","Cheerful","Delightful","Hungry","Ninja","Silly","Wonderful","Fantastic","Amazing","Enthusiastic","Trusting","Courageous","Optimistic","Talented","Funny","Hopeful","Charismatic","Genuine","Creative","Confident","Radiant","Splendid","Harmonious","Intelligent","Dynamic","Vibrant","Brilliant","Excited","Jubilant","Awesome","Happy","Strong","Brave","Witty","Charming","Eager","Caring","Lucky","Jovial","Honest","Polite","Fearless","Sincere","Ecstatic","Zealous","Earnest","Relaxed","Mindful","Energetic"]
  const animals = ["Serpent","Hippo","Giraffe","Bunny","Turtle","Tortoise","Rabbit","Mouse","Cat","Tiger","Puppy","Lion","Elephant","Dolphin","Koala","Cheetah","Panda","Gorilla","Penguin","Flamingo","Zebra","Lemur","Sloth","Ostrich","Raccoon","Meerkat","Peacock","Hyena","Monkey","Capybara","Goose"]
  const name = adjectives[Math.floor(Math.random() * adjectives.length)] + " " + animals[Math.floor(Math.random() * animals.length)];
  return name;
}

function generateClientId() {
  let id = "";
  const data = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 10; i++) {
    id += data.charAt(Math.floor(Math.random() * data.length));
  }
  return id;
}

function generateServerId() {
  let id = "";
  const data = "0123456789";
  while (id.length < 4) {
    let temp = data.charAt(Math.floor(Math.random() * data.length));
    while (id.length === 0 && temp === "0") {
      temp = data.charAt(Math.floor(Math.random() * data.length));
    }
    id += temp;
  }
  return id;
}
