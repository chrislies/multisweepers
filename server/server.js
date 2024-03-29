const express = require("express");
const http = require("http");
const WebSocketServer = require("websocket").server;
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Use the cors middleware to allow cross-origin requests
app.use(
  cors({
    origin: "https://multisweepers.netlify.app",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

const wsServer = new WebSocketServer({
  httpServer: server,
});
///////////////////////////////////////////////////////////////////////
// const express = require("express");
// const http = require("http");
// const WebSocketServer = require("websocket").server;

// const app = express();
// const server = http.createServer(app);

// const wsServer = new WebSocketServer({
//   httpServer: server,
// });
///////////////////////////////////////////////////////////////////////
server.listen(process.env.PORT || 8080, () => {
  console.log("Listening on port");
});

let clients = {};
let servers = {};
let gameState = {};

wsServer.on("request", (req) => {
  const connection = req.accept(null, req.origin);
  const clientId = generateClientId();
  const serverId = generateServerId();
  const username = generateName();
  let clientFlags = [];
  let visitedTilesValue = [];
  let flaggedTilesValue = [];
  let buttonFlagCounter = 0;
  let numMines = 0;
  let randomMines = [];
  let gameDifficulty = "";
  let possibleMove = [];
  let mineRadiusNB = [];
  let mineRadiusLB = [];
  let mineRadiusRB = [];
  let clientMessages = [];
  clients[clientId] = {
    clientId: clientId,
    serverId: serverId,
    username: username,
    connection: connection,
    clientFlags: clientFlags,
    spectate: false,
    wins: 0,
    clientMessages: clientMessages,
  };
  servers[serverId] = {
    serverId: serverId,
    clients: [clients[clientId]],
    gameState: gameState,
  };
  gameState[serverId] = {
    gameOver: false,
    enableJoining: true,
    playersSpectating: 0,
    visitedTilesValue: visitedTilesValue,
    flaggedTilesValue: flaggedTilesValue,
    buttonFlagCounter: buttonFlagCounter,
    numMines: numMines,
    randomMines: randomMines,
    gameDifficulty: gameDifficulty,
    possibleMove: possibleMove,
    mineRadiusNB: mineRadiusNB,
    mineRadiusLB: mineRadiusLB,
    mineRadiusRB: mineRadiusRB,
  };
  connection.send(
    JSON.stringify({
      method: "connected",
      clientId: clientId,
      serverId: serverId,
      username: username,
      playerCount: servers[serverId].clients.length,
    })
  );
  sendAvailableServers(); // send available servers to all clients
  connection.on("message", onMessage);

  // Handle client disconnect
  connection.on("close", (reasonCode, description) => {
    const leftServerId = clients[clientId].serverId;
    const leftClientUsername = clients[clientId].username;
    // console.log(
    //   `Player "${clients[clientId].username}" disconnected from server ${leftServerId}. Reason: ${description}`
    // );
    // Find the index of the disconnected client in the server's clients array
    const clientIndex = servers[leftServerId].clients.findIndex(
      (client) => client.clientId === clientId
    );
    if (clientIndex !== -1) {
      // Remove the client from the server's clients array
      servers[leftServerId].clients.splice(clientIndex, 1);
      // console.log(`servers[${leftServerId}].clients.length = ${servers[leftServerId].clients.length}`);
    } else {
      console.log(
        `Client with ID ${clientId} not found in server ${leftServerId}`
      );
    }
    let newClientFlags = clients[clientId].clientFlags;
    if (gameState[leftServerId].playersSpectating > 0) {
      gameState[leftServerId].playersSpectating -= 1;
    }
    delete clients[clientId];

    // ---------- JUST FOR CHECKING ----------
    // console.log(`remaining servers:`);
    // for (s in servers) {
    //   console.log(
    //     `servers[${s}].clients.length = ${servers[s].clients.length}`
    //   );
    // }
    // ---------- JUST FOR CHECKING ----------
    const updatedPlayerList = [];
    for (const clientId in servers[leftServerId].clients) {
      const client = servers[leftServerId].clients[clientId];
      updatedPlayerList.push(client.username);
    }
    // console.log(`updatedPlayerList = ${updatedPlayerList}`);
    // send the updated player list to the other client in that server
    // and, if old server has another client, they now own the flags of the client that left
    for (const client of Object.values(clients)) {
      if (client.serverId === leftServerId) {
        client.connection.send(
          JSON.stringify({
            method: "updatePlayersList",
            updatedPlayerList: updatedPlayerList,
            playerCount: servers[leftServerId].clients.length,
            newClientFlags: newClientFlags,
            playersSpectating: gameState[leftServerId].playersSpectating,
          })
        );
        client.connection.send(
          JSON.stringify({
            method: "updateChat",
            status: "otherClientLeft",
            player: leftClientUsername,
            serverId: leftServerId,
          })
        );
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
    case "joinServer":
      if (servers[data.serverId]) {
        // Server exists
        // Prevent user from joining own's server
        if (
          clients[data.clientId].serverId === servers[data.serverId].serverId
        ) {
          clients[data.clientId].connection.send(
            JSON.stringify({
              method: "alreadyInServer",
              serverId: data.serverId,
            })
          );
          break;
        }

        // Prevent user from joining a full server
        if (servers[data.serverId].clients.length === 2) {
          if (clients[data.clientId]) {
            clients[data.clientId].connection.send(
              JSON.stringify({
                method: "serverIsFull",
                serverId: data.serverId,
              })
            );
          }
          break;
        }

        // Prevent user from joining a server that disabled mulitplayer
        if (gameState[data.serverId].enableJoining == false) {
          clients[data.clientId].connection.send(
            JSON.stringify({
              method: "serverDisabledJoining",
              serverId: data.serverId,
            })
          );
          break;
        }

        // update client's serverId with new server
        // const oldServerId = clients[data.clientId].serverId;
        servers[data.oldServerId].clients.length -= 1;
        clients[data.clientId].serverId = data.serverId;

        // console.log(
        //   `${data.username} left server ${data.oldServerId} to join server ${data.serverId}`
        // );

        servers[data.serverId].clients.push(clients[data.clientId]);

        // create a usernameList array for the current server
        const usernameList = [];
        for (const client in clients) {
          if (clients[client].serverId === data.serverId) {
            usernameList.push(clients[client].username);
          }
        }
        // console.log(
        //   `usernameList for server ${data.serverId} = ${usernameList}`
        // );
        clients[data.clientId].wins = 0; // reset client wins when they join a new server
        let otherClientWins = 0;
        for (const clientId in clients) {
          if (
            clients[clientId].serverId === data.serverId &&
            clients[clientId].clientId === data.clientId
          ) {
            // console.log(
            //   `${clients[clientId].username} joined server ${data.serverId}`
            // );
            for (const clientId in clients) {
              if (
                clients[clientId].serverId === data.serverId &&
                clients[clientId].clientId !== data.clientId
              ) {
                otherClientWins = clients[clientId].wins;
              }
            }
            clients[clientId].connection.send(
              JSON.stringify({
                method: "joinedServer",
                serverId: data.serverId,
                playerCount: Object.keys(servers[data.serverId].clients).length,
                usernameList: usernameList,
                player: clients[data.clientId].username,
                clientFlags: [],
                playersSpectating: gameState[data.serverId].playersSpectating,
                gameDifficulty: gameState[data.serverId].gameDifficulty,
                visitedTilesValue: gameState[data.serverId].visitedTilesValue,
                flaggedTilesValue: gameState[data.serverId].flaggedTilesValue,
                buttonFlagCounter: gameState[data.serverId].buttonFlagCounter,
                randomMines: gameState[data.serverId].randomMines,
                numMines: gameState[data.serverId].numMines,
                possibleMove: gameState[data.serverId].possibleMove,
                mineRadiusNB: gameState[data.serverId].mineRadiusNB,
                mineRadiusLB: gameState[data.serverId].mineRadiusLB,
                mineRadiusRB: gameState[data.serverId].mineRadiusRB,
                sendToServer: false,
                isJoiningClient: true,
                otherClientWins: otherClientWins,
              })
            );
            // clear chat messages for the user that is joining new server
            clients[clientId].clientMessages = [];
            clients[clientId].connection.send(
              JSON.stringify({
                method: "updateChat",
                status: "clearChatMessages",
                player: clients[data.clientId].username,
                serverId: data.serverId,
              })
            );
          } else if (
            clients[clientId].serverId === data.serverId &&
            clients[clientId].clientId !== data.clientId
          ) {
            // send this to the other client ALREADY in server
            // console.log(
            //   `Player: ${clients[clientId].username} is other player in server ${data.serverId}`
            // );
            clients[clientId].connection.send(
              JSON.stringify({
                method: "joinedServer",
                serverId: data.serverId,
                playerCount: Object.keys(servers[data.serverId].clients).length,
                usernameList: usernameList,
                player: clients[data.clientId].username,
                clientFlags: clients[clientId].clientFlags,
                isJoiningClient: false,
                otherClientWins: clients[data.clientId].wins,
              })
            );
            clients[clientId].connection.send(
              JSON.stringify({
                method: "updateChat",
                status: "newClientJoined",
                serverId: data.serverId,
                player: data.username,
              })
            );
          }
        }

        // update the usernames for the old server
        const updatedPlayerList = [];
        for (const clientId in clients) {
          if (clients[clientId].serverId === data.oldServerId) {
            updatedPlayerList.push(clients[clientId].username);
          }
        }
        // console.log(
        //   `updatedPlayerList for server ${data.oldServerId} = ${updatedPlayerList}`
        // );
        // send the updated player list to the other client in that server
        for (const clientId in clients) {
          if (clients[clientId].serverId === data.oldServerId) {
            clients[clientId].connection.send(
              JSON.stringify({
                method: "updatePlayersList",
                updatedPlayerList: updatedPlayerList,
                playerCount: servers[data.oldServerId].clients.length,
              })
            );
          }
        }
        sendAvailableServers(); // update and remove the server from the serversList since server is now full
      } else {
        // Server DNE!
        if (clients[data.clientId]) {
          clients[data.clientId].connection.send(
            JSON.stringify({
              method: "serverDNE",
              serverId: data.serverId,
            })
          );
        }
      }
      break;
    case "removeFlagForOtherClient":
      // when a flag is removed via right click
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          // console.log(`remove flag ${data.flagValueToRemove} from player ${otherClient.username}`)
          // console.log(`nonupdated list   = ${otherClient.clientFlags}`)
          let flagIndexToRemove = otherClient.clientFlags.indexOf(
            data.flagValueToRemove
          );
          // console.log(`flagIndexToRemove: ${flagIndexToRemove}`);
          otherClient.clientFlags.splice(flagIndexToRemove, 1);
          // console.log(`updated flag list = ${otherClient.clientFlags}`)
          otherClient.connection.send(
            JSON.stringify({
              method: "removedFlagForOtherClient",
              clientFlags: otherClient.clientFlags,
              flagValueToRemove: data.flagValueToRemove,
              buttonFlagCounter: data.buttonFlagCounter,
            })
          );
        }
      }
      break;
    case "removeFlagsForOtherClient":
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          // console.log(
          //   `remove flags ${data.flagValuesToRemove} from player ${otherClient.username}`
          // );
          // console.log(`nonupdated list   = ${otherClient.clientFlags}`)
          otherClient.clientFlags = otherClient.clientFlags.filter(
            (flag) => !data.flagValuesToRemove.includes(flag)
          );
          // console.log(`updated flag list = ${otherClient.clientFlags}`)
          otherClient.connection.send(
            JSON.stringify({
              method: "removedFlagsForOtherClient",
              clientFlags: otherClient.clientFlags,
              flagValuesToRemove: data.flagValuesToRemove,
              buttonFlagCounter: data.buttonFlagCounter,
            })
          );
        }
      }

      break;
    case "updateFlags":
      clients[data.clientId].clientFlags = data.clientFlags;
      gameState[data.serverId].flaggedTilesValue = data.serverFlags;
      gameState[data.serverId].buttonFlagCounter = data.buttonFlagCounter;
      // console.log(`data.serverFlags = ${data.serverFlags}`)
      // console.log(`gameState[data.serverId].flaggedTilesValue = ${gameState[data.serverId].flaggedTilesValue}`)
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateFlagsForOtherClient",
              otherClientFlags: data.clientFlags,
              serverFlags: data.serverFlags,
              buttonFlagCounter: data.buttonFlagCounter,
            })
          );
        }
      }
      break;
    case "updateGameState":
      clients[data.clientId].clientFlags = clients[data.clientId].clientFlags;
      // console.log(`${clients[data.clientId].username}'s flags: ${clients[data.clientId].clientFlags}`);
      gameState[data.serverId].gameOver = data.gameState.gameOver;
      gameState[data.serverId].enableJoining = data.gameState.enableJoining;
      gameState[data.serverId].playersSpectating =
        data.gameState.playersSpectating;
      gameState[data.serverId].visitedTilesValue =
        data.gameState.visitedTilesValue;
      gameState[data.serverId].flaggedTilesValue =
        data.gameState.flaggedTilesValue;
      gameState[data.serverId].buttonFlagCounter =
        data.gameState.buttonFlagCounter;
      gameState[data.serverId].numMines = data.gameState.numMines;
      gameState[data.serverId].randomMines = data.gameState.randomMines;
      gameState[data.serverId].gameDifficulty = data.gameState.gameDifficulty;
      gameState[data.serverId].possibleMove = data.gameState.possibleMove;
      gameState[data.serverId].mineRadiusNB = data.gameState.mineRadiusNB;
      gameState[data.serverId].mineRadiusLB = data.gameState.mineRadiusLB;
      gameState[data.serverId].mineRadiusRB = data.gameState.mineRadiusRB;

      // update the game state for the other player
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateGameState",
              otherClient: otherClient.username,
              gameOver: gameState[data.serverId].gameOver,
              enableJoining: gameState[data.serverId].enableJoining,
              playerOneFlags: clients[data.clientId].clientFlags,
              playersSpectating: gameState[data.serverId].playersSpectating,
              visitedTilesValue: gameState[data.serverId].visitedTilesValue,
              flaggedTilesValue: gameState[data.serverId].flaggedTilesValue,
              buttonFlagCounter: gameState[data.serverId].buttonFlagCounter,
              numMines: gameState[data.serverId].numMines,
              randomMines: gameState[data.serverId].randomMines,
              gameDifficulty: gameState[data.serverId].gameDifficulty,
              possibleMove: gameState[data.serverId].possibleMove,
              mineRadiusNB: gameState[data.serverId].mineRadiusNB,
              mineRadiusLB: gameState[data.serverId].mineRadiusLB,
              mineRadiusRB: gameState[data.serverId].mineRadiusRB,
            })
          );
        }
      }
      break;
    case "updateGameState_InitialClick":
      // update the game state for the other player when initialClick() executes
      gameState[data.serverId].visitedTilesValue =
        data.gameState.visitedTilesValue;
      gameState[data.serverId].numMines = data.gameState.numMines;
      gameState[data.serverId].randomMines = data.gameState.randomMines;
      gameState[data.serverId].possibleMove = data.gameState.possibleMove;
      gameState[data.serverId].mineRadiusNB = data.gameState.mineRadiusNB;
      gameState[data.serverId].mineRadiusLB = data.gameState.mineRadiusLB;
      gameState[data.serverId].mineRadiusRB = data.gameState.mineRadiusRB;
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateGameState_InitialClick",
              otherClient: otherClient.username,
              visitedTilesValue: gameState[data.serverId].visitedTilesValue,
              // "flaggedTilesValue": gameState[data.serverId].flaggedTilesValue,
              numMines: gameState[data.serverId].numMines,
              randomMines: gameState[data.serverId].randomMines,
              possibleMove: gameState[data.serverId].possibleMove,
              mineRadiusNB: gameState[data.serverId].mineRadiusNB,
              mineRadiusLB: gameState[data.serverId].mineRadiusLB,
              mineRadiusRB: gameState[data.serverId].mineRadiusRB,
            })
          );
        }
      }
      break;
    case "updateVisitedTilesForOtherClient":
      gameState[data.serverId].visitedTilesValue =
        data.gameState.visitedTilesValue;
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateVisitedTilesForOtherClient",
              otherClient: otherClient.username,
              visitedTilesValue: gameState[data.serverId].visitedTilesValue,
            })
          );
        }
      }
      break;
    case "clearGameState":
      gameState[data.serverId].gameOver = false;
      gameState[data.serverId].playersSpectating = 0;
      gameState[data.serverId].visitedTilesValue = [];
      gameState[data.serverId].flaggedTilesValue = [];
      gameState[data.serverId].randomMines = [];
      gameState[data.serverId].possibleMove = [];
      gameState[data.serverId].mineRadiusNB = [];
      gameState[data.serverId].mineRadiusLB = [];
      gameState[data.serverId].mineRadiusRB = [];
      for (const client in clients) {
        if (clients[client].serverId === data.serverId) {
          clients[client].connection.send(
            JSON.stringify({
              method: "clearGameState",
              gameState: gameState[data.serverId],
            })
          );
        }
      }
      break;
    case "generateGameForOtherClient":
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "generateGameForOtherClient",
              gameDifficulty: data.gameState.gameDifficulty,
            })
          );
        }
      }
      break;
    case "foundMine":
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "foundMine",
              mineValue: data.mineValue,
            })
          );
        }
      }
      break;
    case "handleGameWon":
      gameState[data.serverId].gameOver = data.gameState.gameOver;
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "handleGameWon",
              gameOver: data.gameState.gameOver,
            })
          );
        }
      }
      break;
    case "updateClientWins":
      clients[data.clientId].wins = data.wins;
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateClientWins",
              wins: data.wins,
            })
          );
        }
      }
      break;
    case "storeChatMessage":
      clients[data.clientId].clientMessages.push(data.chatMessage);
      for (const client in clients) {
        if (
          clients[client].serverId === data.serverId &&
          clients[client].clientId !== data.clientId
        ) {
          const otherClient = clients[client];
          otherClient.connection.send(
            JSON.stringify({
              method: "updateChat",
              status: "otherClientMessage",
              chatMessage: data.chatMessage,
            })
          );
        }
      }
      break;
  }
}

function sendAvailableServers() {
  // Create a list of available servers with player counts
  const serversList = [];
  console.log("Servers online:");
  for (const serverId in servers) {
    if (servers[serverId].clients.length !== 0) {
      console.log(
        `serverId = ${serverId}; clients = ${servers[serverId].clients.length}`
      );
      serversList.push({
        serverId: serverId,
        playerCount: servers[serverId].clients.length,
      });
    }
  }
  console.log("------------------");
  for (const clientId in clients) {
    clients[clientId].connection.send(
      JSON.stringify({
        method: "updateServersList",
        list: serversList,
      })
    );
  }
}

function generateName() {
  const adjectives = [
    "Joyful",
    "Samurai",
    "Warrior",
    "Friendly",
    "Cheerful",
    "Delightful",
    "Hungry",
    "Ninja",
    "Silly",
    "Wonderful",
    "Fantastic",
    "Amazing",
    "Enthusiastic",
    "Trusting",
    "Courageous",
    "Optimistic",
    "Talented",
    "Funny",
    "Hopeful",
    "Charismatic",
    "Genuine",
    "Creative",
    "Confident",
    "Radiant",
    "Splendid",
    "Harmonious",
    "Intelligent",
    "Dynamic",
    "Vibrant",
    "Brilliant",
    "Excited",
    "Jubilant",
    "Awesome",
    "Happy",
    "Strong",
    "Brave",
    "Witty",
    "Charming",
    "Eager",
    "Caring",
    "Lucky",
    "Jovial",
    "Honest",
    "Polite",
    "Fearless",
    "Sincere",
    "Ecstatic",
    "Zealous",
    "Earnest",
    "Relaxed",
    "Mindful",
    "Energetic",
  ];
  const animals = [
    "Serpent",
    "Hippo",
    "Giraffe",
    "Bunny",
    "Turtle",
    "Tortoise",
    "Rabbit",
    "Mouse",
    "Cat",
    "Tiger",
    "Puppy",
    "Lion",
    "Elephant",
    "Dolphin",
    "Koala",
    "Cheetah",
    "Panda",
    "Gorilla",
    "Penguin",
    "Flamingo",
    "Zebra",
    "Lemur",
    "Sloth",
    "Ostrich",
    "Raccoon",
    "Meerkat",
    "Peacock",
    "Hyena",
    "Monkey",
    "Capybara",
    "Goose",
  ];
  const name =
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    " " +
    animals[Math.floor(Math.random() * animals.length)];
  // const alphabet = ["Alpha","Bravo","Charlie","Delta","Echo","Foxtrot","Golf","Hotel","India","Juliett","Kilo","Lima","Mike","November","Oscar","Papa","Quebec","Romeo","Sierra","Tango","Uniform","Victor","Whiskey","X-ray","Yankee","Zulu"];
  // const name = alphabet[Math.floor(Math.random() * alphabet.length)];
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
  // console.log(servers)
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
