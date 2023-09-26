const { send } = require("process");

let clients = {};
let servers = {};

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
  clients[clientId] = {
    clientId: clientId,
    serverId: serverId,
    username: username,
    connection: connection
  };
  servers[serverId] = {
    serverId: serverId,
    clients: [clients[clientId]]
  };
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
    console.log(`Player "${clients[clientId].username}" disconnected. Reason: ${description}`);
    
    // Check if the client was in a server
    if (servers[serverId]) {
      console.log(`Player "${clients[clientId].username}" left server ${servers[serverId].serverId}`);
      // Find the client with a matching clientId
      const clientIndex = servers[serverId].clients.findIndex(client => client.clientId === clientId);
      if (clientIndex !== -1) {
        // Remove the client from the server's client list
        servers[serverId].clients.splice(clientIndex, 1);
        console.log(`Removed client with ID ${clientId} from server ${serverId}`);
      } else {
        console.log(`Client with ID ${clientId} not found in server ${serverId}`);
      }

      // for (s in servers) {
      //   console.log(`servers[${s}].clients.length = ${servers[s].clients.length}`);
      // }
      
      // If the server is now empty, remove it
      if (servers[serverId].clients.length === 0) {
        delete servers[serverId];
      }
    }
    // Remove the client from the clients object
    delete clients[clientId];
    console.log(`remaining servers:`)
    for (s in servers) {
      console.log(s);
    }
    // Update and send available servers to clients
    sendAvailableServers();
    
    const updatedPlayerList = Object.values(clients).map(client => client.username);
    console.log(`updatedPlayerList = ${updatedPlayerList}`);

    // send the updated player list to the other client in that server
    for (const client of Object.values(clients)) {
      console.log(`client = ${client}`);
      if (client.serverId === serverId) {
        client.connection.send(JSON.stringify({
          method: "updatePlayersList",
          usernameList: updatedPlayerList
        }));
      }    
    }
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
        let alreadyInServer = false;
        for (const p of servers[data.serverId].clients) {
          if (p.clientId == data.clientId) {  
            alreadyInServer = true;
            if (clients[data.clientId]) {
              clients[data.clientId].connection.send(JSON.stringify({
                "method": "alreadyInServer",
                "serverId": data.serverId
              }));
            }
            break; // Exit the loop
          }
        }
        if (alreadyInServer) {  // If already in the server, don't continue further
          break; // Exit the switch block
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
        const oldServerId = clients[data.clientId].serverId;
        servers[oldServerId].clients.length -= 1;
        clients[data.clientId].serverId = data.serverId;

        const client = {
          "clientId": data.clientId,
          "username": data.username,
          "wins": 0,
          "oofs": 0,
          "connection": clients[data.clientId].connection // Get the client's connection
        };
        servers[data.serverId].clients.push(client);

        // create a usernameList array for the current server
        const usernameList = [];
        for (const client in clients) {
          if (clients[client].serverId === data.serverId) {
            usernameList.push(clients[client].username);
          }
        }
        servers[data.serverId].clients.forEach(c => {
          if (clients[c.clientId]) {
            clients[c.clientId].connection.send(JSON.stringify({
              "method": "joinedServer",
              "serverId": data.serverId,
              "playerCount": Object.keys(servers[data.serverId].clients).length,
              "usernameList": usernameList
            }));
          }
        });
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
  }
}

function sendAvailableServers() {
  // Create a list of available servers with player counts
  const serversList = [];
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
  
// function updatePlayersList() {
//   const playersList = [];
//   for (const serverId in servers) {
//     if (servers[serverId].clients.length !== 0) {
//       playersList.push({
//         serverId: serverId,
//         // players: servers[serverId].clients
//         playerCount: servers[serverId].clients.length
//       });
//     }
//   }
//   for (const clientId in clients) {
//     clients[clientId].connection.send(
//       JSON.stringify({
//         method: "updatePlayersList",
//         usernameList: playersList
//       })
//     );
//   }
// }

        // // create a usernameList array for the current server
        // const usernameList = [];
        // for (const client in clients) {
        //   if (clients[client].serverId === data.serverId) {
        //     usernameList.push(clients[client].username);
        //   }
        // }
        // servers[data.serverId].clients.forEach(c => {
        //   if (clients[c.clientId]) {
        //     clients[c.clientId].connection.send(JSON.stringify({
        //       "method": "joinedServer",
        //       "serverId": data.serverId,
        //       "playerCount": Object.keys(servers[data.serverId].clients).length,
        //       "usernameList": usernameList
        //     }));
        //   }
        // });


// function updatePlayersList() {
//   const playersList = [];

//   for (const serverId in servers) {
//     const server = servers[serverId];
//     if (server && server.clients) {
//       const playerInfo = server.clients.map(client => {
//         return {
//           clientId: client.clientId,
//           username: client.username,
//           wins: client.wins,
//           oofs: client.oofs,
//         };
//       });

//       playersList.push({
//         serverId: serverId,
//         players: playerInfo,
//         playerCount: server.clients.length,
//       });
//     }
//   }

//   for (const clientId in clients) {
//     const client = clients[clientId];
//     if (client && client.connection) {
//       client.connection.send(
//         JSON.stringify({
//           method: "updatePlayersList",
//           usernameList: playersList,
//         })
//       );
//     }
//   }
// }


function generateName() {
  const adjectives = [
    "Joyful",
    "Samurai",
    "Warrior",
    "Friendly",
    "Cheerful",
    // ... (other adjectives)
  ];
  const animals = [
    "Serpent",
    "Hippo",
    "Giraffe",
    "Bunny",
    "Turtle",
    // ... (other animals)
  ];
  const name =
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    " " +
    animals[Math.floor(Math.random() * animals.length)];
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
