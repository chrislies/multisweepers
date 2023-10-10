let socket;
let clientId;
let serverId;
let clientUsername;
const serverList = document.querySelector(".servers");
let playerCount = document.querySelector("#playerCount");
let playerList = document.querySelector("#playerList");
let clientFlags = [];
let span;
let buttonFlagCounter = 0;
let flagCounter = document.querySelector(".flagCounter");


let joinServerButton = document.querySelector("#joinServerButton");
joinServerButton.addEventListener("click", (event) => {
  event.preventDefault();
  let serverCode = document.querySelector("#serverCodeInput").value.trim();
  const payLoad = {
    method: "joinServer",
    clientId: clientId,
    serverId: serverCode, // the requested serverId 
    oldServerId: serverId,
    username: clientUsername,
  };
  socket.send(JSON.stringify(payLoad));
});

socket = new WebSocket("ws://localhost:8080");
socket.onmessage = onMessage;

function onMessage(msg) {
  let tiles = document.querySelectorAll("td");
  const data = JSON.parse(msg.data);
  switch (data.method) {
    case "connected":
      console.log("Client connected");
      clientId = data.clientId;
      serverId = data.serverId;
      console.log(`Server id = ${serverId}`);
      serverCode.innerHTML = serverId;
      playerCount.innerHTML = data.playerCount;
      span = document.createElement("span");
      span.innerHTML = data.username;
      playerList.append(span);
      clientUsername = data.username;

      gameState.visitedTilesValue = [];
      gameState.numMines = numMines;
      gameState.randomMines = randomMines;
      gameState.buttonFlagCounter = buttonFlagCounter;
      gameState.gameDifficulty = "easy"
      // Send the updated gameState to the server with the function below
      sendGameStateToServer();
      break;
    case "updateServersList":
      // Clear the existing server list
      while (serverList.firstChild) {
        serverList.removeChild(serverList.lastChild);
      }
      const servers = data.list;
      servers.forEach((server) => {
        let li = document.createElement("h1");
        li.innerHTML = `${server.serverId} (${server.playerCount}/2)`;
        serverList.appendChild(li);
      });
      break;
    case "alreadyInServer":
      console.log(`Already in server "${data.serverId}"`);
      break;
    case "serverIsFull":
      console.log(`Server "${data.serverId}" is full!`)
      break;
    case "joinedServer":
      console.log(`Player ${data.player} joined server "${data.serverId}"`);
      serverId = data.serverId; 
      serverCode.innerHTML = data.serverId;
      playerCount.innerHTML = data.playerCount;
      // clear existing leaderboard
      while (playerList.firstChild) {
        playerList.removeChild(playerList.firstChild);
      };
      let clientUsernameElement; // store a reference to the client's username element
      for (const playerName in data.usernameList) {
        const span = document.createElement("span");
        span.innerHTML = data.usernameList[playerName] + "<br>";
        playerList.append(span);
        if (data.usernameList[playerName] === clientUsername) {
          span.setAttribute("id", "clientUsername");
          clientUsernameElement = span;
        }
      }
      // rearrange player leaderboard so that the client's username is first
      playerList.prepend(clientUsernameElement);
      
      // update player's gameboard to new server's gameboard
      // update the new player's gamestate
      if (data.gameDifficulty) {
        console.log(`${data.player} w/ difficulty ${data.gameDifficulty}`)
        difficulty = data.gameDifficulty;
        gameState.gameDifficulty = data.gameDifficulty;
        selectDifficulty.value = data.gameDifficulty;
        switch (data.gameDifficulty) {
          case "easy":
            generateEasy(data.sendToServer);
            break;
          case "medium":
            generateMedium(data.sendToServer);
            break;
          case "hard":
            generateHard(data.sendToServer);
            break;
        }
        clientFlags = data.clientFlags;
        gameState.visitedTilesValue = data.visitedTilesValue;
        gameState.flaggedTilesValue = data.flaggedTilesValue;
        gameState.randomMines = data.randomMines;
        gameState.buttonFlagCounter = data.buttonFlagCounter;
        gameState.numMines = data.numMines;
        gameState.possibleMove = data.possibleMove;
        gameState.mineRadiusNB = data.mineRadiusNB;
        gameState.mineRadiusLB = data.mineRadiusLB;
        gameState.mineRadiusRB = data.mineRadiusRB;
        updateJoiningClientBoard();
      }
      break;
    case "serverDNE":
      console.log(`Server "${data.serverId}" does not exist!`);
      break;
    case "updatePlayersList": // when a user DISCONNECTS/LEAVES from a full server
      // clear the existing player list/leaderboard
      while (playerList.firstChild) {
        playerList.removeChild(playerList.firstChild);
      }
      // add players to the player list
      for (const playerName in data.updatedPlayerList) {
        const span = document.createElement("span");
        span.innerHTML = data.updatedPlayerList[playerName] + "<br>";;
        playerList.appendChild(span);
      }
      playerCount.innerHTML = data.playerCount;
      break;
    case "removedFlagForOtherClient":
      // whenever a client removes other client's flag
      console.log(`removedFlagsForOtherClient for ${clientUsername}`);
      clientFlags = data.clientFlags;
      tiles = document.querySelectorAll("td");
      console.log(`clientFlags: ${clientFlags}`)
      console.log(`remove flag ${data.flagValueToRemove}`);
      tiles[data.flagValueToRemove].innerHTML = "";
      tiles[data.flagValueToRemove].setAttribute("rightClicked", false);
      console.log(`clientFlags: ${clientFlags}`)
      let flagCounter = document.querySelector(".flagCounter");
      switch (gameState.gameDifficulty) {
        case "easy":
          buttonFlagCounter = 10 - clientFlags.length;
          flagCounter.innerHTML = buttonFlagCounter;
          break;
        case "medium":
          buttonFlagCounter = 40 - clientFlags.length;
          flagCounter.innerHTML = buttonFlagCounter;
          break;
        case "hard":
          buttonFlagCounter = 99 - clientFlags.length;
          flagCounter.innerHTML = buttonFlagCounter;
          break;
      }
      break;
    case "updateFlagsForOtherClient":
      // whenever either client adds or removes their flag
      updateClientBoard(data)
      break;
    case "updateGameState": 
      // console.log(`Updating game state for player ${data.otherClient}`);
      // console.log(`difficulty = ${difficulty}, data.gameDifficulty = ${data.gameDifficulty}`)
      // if (difficulty !== data.gameDifficulty) {
      //   switch (data.gameDifficulty) {
      //     case "easy":
      //       generateEasy(data.sendToServer);
      //       break;
      //     case "medium":
      //       generateMedium(data.sendToServer);
      //       break;
      //     case "hard":
      //       generateHard(data.sendToServer);
      //       break;
      //   }
      // }
      gameState.visitedTilesValue = data.visitedTilesValue;
      gameState.flaggedTilesValue = data.flaggedTilesValue;
      gameState.randomMines = data.randomMines;
      gameState.buttonFlagCounter = data.buttonFlagCounter;
      gameState.numMines = data.numMines;
      gameState.possibleMove = data.possibleMove;
      gameState.mineRadiusNB = data.mineRadiusNB;
      gameState.mineRadiusLB = data.mineRadiusLB;
      gameState.mineRadiusRB = data.mineRadiusRB;
      // updateClientBoard();
      break;
  }
}

const gw = document.querySelector("#gameWindow");
let gameOver = false;
let numMines = 0;
let visitedTilesValue = [];
let flaggedTilesValue = [];
let randomMines = [];
let possibleMove = [];
let mineRadiusNB = [];
let mineRadiusLB = [];
let mineRadiusRB = [];
let difficulty = "";

let gameState = {
  visitedTilesValue: [],
  flaggedTilesValue: [],
  numMines: 0,
  randomMines: [],
  buttonFlagCounter: 0,
  gameDifficulty: "",
  possibleMove: [],
  mineRadiusNB: [],
  mineRadiusLB: [],
  mineRadiusRB: []
};

function generateEasy(sendToServer) {
  gameState.gameDifficulty = "easy";
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }  
  if (document.querySelector(".buddyButton")) {
    document.querySelector(".buddyButton").remove();
  }
  if (document.querySelector(".flagButton")) {
    document.querySelector(".flagButton").remove();
  }
  let n = 9; // n x n grid
  numMines = 10;
  buttonFlagCounter = numMines;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  const container = document.querySelector("#container");
  container.style.transform = "translate(-50%, -50%) scale(2.2)";
  createBuddy();
  createFlagButton();
  paintContainerGrids();
  if (sendToServer) {
    // Update the gameState object
    gameState.visitedTilesValue = [];
    gameState.numMines = numMines;
    gameState.randomMines = randomMines;
    gameState.buttonFlagCounter = buttonFlagCounter;
    gameState.gameDifficulty = "easy"
    // Send the updated gameState to the server with the function below
    sendGameStateToServer();
  }
}

function generateMedium(sendToServer) {
  gameState.gameDifficulty = "medium";
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }
  if (document.querySelector(".buddyButton")) {
    document.querySelector(".buddyButton").remove();
  }
  if (document.querySelector(".flagButton")) {
    document.querySelector(".flagButton").remove();
  }
  let n = 16; // n x n grid
  numMines = 40;
  buttonFlagCounter = numMines;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  const container = document.querySelector("#container");
  container.style.transform = "translate(-50%, -50%) scale(1.6)";
  createBuddy();
  createFlagButton();
  paintContainerGrids();
  if (sendToServer) {
    // Update the gameState object
    gameState.visitedTilesValue = [];
    gameState.numMines = numMines;
    gameState.randomMines = randomMines;
    gameState.buttonFlagCounter = buttonFlagCounter;
    gameState.gameDifficulty = "medium"
    // Send the updated gameState to the server with the function below
    sendGameStateToServer();
  }
}

function generateHard(sendToServer) {
  gameState.gameDifficulty = "hard";
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }
  if (document.querySelector(".buddyButton")) {
    document.querySelector(".buddyButton").remove();
  }
  if (document.querySelector(".flagButton")) {
    document.querySelector(".flagButton").remove();
  }
  let n = 16; // n x m grid
  let m = 30
  numMines = 99;
  buttonFlagCounter = numMines;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < m; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  const container = document.querySelector("#container");
  container.style.transform = "translate(-50%, -50%) scale(1.6)";
  createBuddy();
  createFlagButton();
  paintContainerGrids();
  if (sendToServer) {
    // Update the gameState object
    gameState.visitedTilesValue = [];
    gameState.numMines = numMines;
    gameState.randomMines = randomMines;
    gameState.buttonFlagCounter = buttonFlagCounter;
    gameState.gameDifficulty = "hard"
    // Send the updated gameState to the server with the function below
    sendGameStateToServer();
  }
}

function initialClick() { // clear x surrounding tiles upon inital click on one of the tiles
  // if flag button is clicked, return; otherwise proceed
  if (document.querySelector(".flagButton").getAttribute("flagButtonClicked") === "true") {
    return;
  }
  document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/shocked-icon.png' alt='buddy-shocked'>";
  setTimeout(() => {
    document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
  }, 400);
  let initialTile = this;
  // console.log(`initial tile = ${parseInt(initialTile.dataset.value)}`);
  visitedTiles.push(initialTile);
  gameState.visitedTilesValue.push(parseInt(initialTile.dataset.value));
  let tableSize = document.querySelectorAll("td").length - 1; // get the last td element to determine tableSize
  // console.log("tableSize = " + tableSize);
  let numRandomTiles = 0;
  // console.log(parseInt(initialTile.dataset.value) + possibleMove[0]); // parseInt() converts string to int

  // difficulty = selectDifficulty.value;  // Check selected difficulty
  difficulty = gameState.gameDifficulty;  // Check selected difficulty
  switch (difficulty) {
    case "easy":
      numMines = 10;
      possibleMove = [9, 1, -9, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-10, -9, -8, -1, 1, 8, 9, 10];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-9, -8, 1, 9, 10];  // possible mine locations for each left border tile
      mineRadiusRB = [-10, -9, -1, 8, 9];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (25 - 8) + 8);  // generate random # between [8-25)
      console.log("[easy: initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "medium":
      numMines = 40;
      possibleMove = [16, 1, -16, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-17, -16, -15, -1, 1, 15, 16, 17];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-16, -15, 1, 16, 17];  // possible mine locations for each left border tile
      mineRadiusRB = [-17, -16, -1, 15, 16];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (34 - 17) + 17);  // generate random # between [17-34)
      console.log("[medium: initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "hard":
      numMines = 99;
      possibleMove = [30, 1, -30, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-31, -30, -29, -1, 1, 29, 30, 31];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-30, -29, 1, 30, 31];  // possible mine locations for each left border tile
      mineRadiusRB = [-31, -30, -1, 29, 30];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (48 - 31) + 31);  // generate random # between [31-48)
      console.log("[hard: initial click] Number of random tiles: " + numRandomTiles);
      break;
  }

  while (visitedTiles.length < numRandomTiles) {
    let randomMove = Math.round(Math.random() * 3);
    let nextTileValue = parseInt(initialTile.dataset.value) + possibleMove[randomMove];
    let nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
    while (nextTileValue === null || nextTileValue < 0 || nextTileValue >= tableSize) {
      randomMove = Math.round(Math.random() * 3);
      nextTileValue = parseInt(initialTile.dataset.value) + possibleMove[randomMove];
      nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
    }
    while ((visitedTiles.includes(nextTile) || nextTile === initialTile)) { // add check for nextTile not being initialTile and not already visited
      randomMove = Math.round(Math.random() * 3);
      nextTileValue += possibleMove[randomMove];
      nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
      while (nextTileValue === null || nextTileValue < 0 || nextTileValue >= tableSize) {
        randomMove = Math.round(Math.random() * 3);
        nextTileValue = parseInt(initialTile.dataset.value) + possibleMove[randomMove];
        nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
      }
    }
    visitedTiles.push(nextTile);
    gameState.visitedTilesValue.push(parseInt(nextTile.dataset.value))
  }

  // convert the string dataset.value of each visitedTiles[] into int
  let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  // alternative version w/o map:
  // let valueVisitedTiles = []
  // visitedTiles.forEach(function(td){
  //   valueVisitedTiles.push(parseInt(td.dataset.value));
  // }); 

  // Generate mines
  let tiles = document.querySelectorAll("td");
  while (randomMines.length < numMines) {
    let randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    while (randomMines.includes(randomNum) || valueVisitedTiles.includes(randomNum)) {
      randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    }
    randomMines.push(randomNum);
    tiles[randomNum].style.backgroundColor = "red";
    // tile[randomNum].className += "-mine";
  }

  // for each visited tile: 
  // 1. check and remove flag, and then change the tile's background color 
  // 2. check its surrounding tiles for mines (scanMineRadius(tile))
  // console.log(visitedTiles);
  // console.log(valueVisitedTiles);
  
  // visitedTiles.forEach(td => {
  //   console.log(`tile ${td.dataset.value}= ${td.getAttribute("rightClicked")}`);
  //   if (td.getAttribute("rightClicked") === "true" || gameState.flaggedTilesValue.includes(parseInt(td.dataset.value))) {
  //     td.setAttribute("rightClicked", "false");
  //     td.innerHTML = "";  // clears the innerHTML of a td element to account for flag icon
  //     console.log(`unflagging tile ${parseInt(td.dataset.value)}`)
  //     let removeFlagsForOtherClient = [];
      
  //     let currTileIndex = gameState.flaggedTilesValue.findIndex(i => i === parseInt(td.dataset.value));
  //     gameState.flaggedTilesValue.splice(currTileIndex, 1);
  //     sendGameStateToServer();
  //     if (clientFlags.includes(parseInt(td.dataset.value))) {
  //       buttonFlagCounter += 1; // update the total flag counter by 'returning' the flag to the counter
  //       document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
  //       currTileIndex = clientFlags.findIndex(i => i === parseInt(td.dataset.value));
  //       clientFlags.splice(currTileIndex, 1);
  //       updateFlagsToServer();
  //     }
  //     removeFlagsForOtherClient.push(parseInt(td.dataset.value));
  //     if (socket.readyState === WebSocket.OPEN) {
  //       socket.send(JSON.stringify({
  //         method: "removeFlagsForOtherClient",
  //         flagValuesToRemove: removeFlagsForOtherClient,
  //         serverId: serverId,
  //         clientId: clientId
  //       }))
  //     }

  //   }
  //   scanMineRadius(td);
  //   if (td.innerHTML === "") {
  //     floodFill(td);
  //   }
  //   td.style.backgroundColor = "#707070";
  tiles = document.querySelectorAll("td");
  // console.log(gameState.visitedTilesValue)
  gameState.visitedTilesValue.forEach(tileVal => {
    // console.log(`tile ${tileVal}= ${tiles[tileVal].getAttribute("rightClicked")}`);
    if (tiles[tileVal].getAttribute("rightClicked") === "true" || gameState.flaggedTilesValue.includes(tileVal)) {
      tiles[tileVal].setAttribute("rightClicked", "false");
      tiles[tileVal].innerHTML = "";  // clears the innerHTML of a td element to account for flag icon
      // console.log(`unflagging tile ${tileVal}`)
      let removeFlagsForOtherClient = [];
      
      let currTileIndex = gameState.flaggedTilesValue.findIndex(i => i === tileVal);
      gameState.flaggedTilesValue.splice(currTileIndex, 1);
      if (clientFlags.includes(tileVal)) {
        buttonFlagCounter += 1; // update the total flag counter by 'returning' the flag to the counter
        document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
        currTileIndex = clientFlags.findIndex(i => i === tileVal);
        clientFlags.splice(currTileIndex, 1);
        updateFlagsToServer();
      }
      removeFlagsForOtherClient.push(tileVal);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          method: "removeFlagsForOtherClient",
          flagValuesToRemove: removeFlagsForOtherClient,
          serverId: serverId,
          clientId: clientId
        }))
      }

    }
    scanMineRadius(tiles[tileVal]);
    if (tiles[tileVal].innerHTML === "") {
      floodFill(tiles[tileVal]);
    }
    tiles[tileVal].style.backgroundColor = "#707070";
  });

  // after doing initial click, for each td element:
  // remove "initialClick" event listener 
  // add "leftClick" event listener ONLY IF tile has not been visited
  tiles.forEach(td => {
    td.removeEventListener("click", initialClick);
    if (!visitedTiles.includes(td)) {
      td.addEventListener("click", leftClick);
    }
  });
  // gameState.visitedTilesValue = visitedTiles.map(tile => parseInt(tile.dataset.value));
  gameState.randomMines = randomMines;
  gameState.possibleMove = possibleMove;
  gameState.mineRadiusNB = mineRadiusNB;
  gameState.mineRadiusLB = mineRadiusLB;
  gameState.mineRadiusRB = mineRadiusRB;
  sendGameStateToServer();
}

function scanMineRadius(tile) {
  let colLength = document.querySelector("tr").children.length; // the number of elements in a row
  let mineCounter = 0;
  let mineRadius = [];
  let tileValue = parseInt(tile.dataset.value);

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, mineRadius becomes limited to mineRadiusLB
    if (mineRadiusLB.length === 0) {
      mineRadius = gameState.mineRadiusLB;
    } else {
      mineRadius = mineRadiusLB;
    } 
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, mineRadius becomes limited to mineRadiusRB
    if (mineRadiusRB.length === 0) {
      mineRadius = gameState.mineRadiusRB;
    } else {
      mineRadius = mineRadiusRB;
    } 
  } else {
    // If current tile is not on either border, mineRadius does not need to be limited
    if (mineRadiusNB.length === 0) {
      mineRadius = gameState.mineRadiusNB;
    } else {
      mineRadius = mineRadiusNB;
    } 
  }
  for (let i = 0; i < mineRadius.length; i++) {
    if (gameState.randomMines.includes(tileValue + mineRadius[i])) {
      mineCounter++;
    }
    if (mineCounter > 0) {
      tile.innerHTML = mineCounter;
      switch(mineCounter) {
        case 1:
          tile.style.color = "#0100fa"; 
          break;
        case 2:
          tile.style.color = "#028002";
          break;
        case 3:
          tile.style.color = "#fb0102";
          break;
        case 4:
          tile.style.color = "#000081";
          break;
        case 5:
          tile.style.color = "#7f0201";
          break;
        case 6:
          tile.style.color = "#007f7e";
          break;
        case 7:
          tile.style.color = "#000000";
          break;
        case 8:
          tile.style.color = "#FFFFFF";
          break;
      }
    }
  }
}

function floodFill(tile) {
  let colLength = document.querySelector("tr").children.length; // the number of elements in a row
  let floodRadius = [];
  let tileValue = parseInt(tile.dataset.value);
  let tiles = document.querySelectorAll("td");
  let removeFlagsForOtherClient = [];

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, floodRadius becomes limited to mineRadiusLB
    if (mineRadiusLB.length === 0) {
      floodRadius = gameState.mineRadiusLB;
    } else {
      floodRadius = mineRadiusLB;
    }
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, floodRadius becomes limited to mineRadiusRB
    if (mineRadiusRB.length === 0) {
      floodRadius = gameState.mineRadiusRB;
    } else {
      floodRadius = mineRadiusRB;
    }
  } else {
    // If current tile is not on either border, floodRadius does not need to be limited
    if (mineRadiusNB.length === 0) {
      floodRadius = gameState.mineRadiusNB;
    } else {
      floodRadius = mineRadiusNB;
    }
  }

  for (let i = 0; i < floodRadius.length; i++) {
    let nextTileValue = tileValue + floodRadius[i];
    if (tiles[nextTileValue]) {
      if (!gameState.visitedTilesValue.includes(nextTileValue)) {
        visitedTiles.push(tiles[nextTileValue]);
        gameState.visitedTilesValue.push(nextTileValue);
        // console.log(`visitedTiles = ${visitedTiles}`)
        // console.log(`gameState.visitedTilesValue = ${gameState.visitedTilesValue}`)
        tiles[nextTileValue].style.backgroundColor = "#707070";
        if (gameState.flaggedTilesValue.includes(nextTileValue)) {
          // console.log(`gameState.flaggedTilesValue.includes(${nextTileValue})`)
          // unflag the tile 
          let flagCounter = document.querySelector(".flagCounter");
          tiles[nextTileValue].innerHTML = "";
          tiles[nextTileValue].setAttribute("rightClicked", "false");
          buttonFlagCounter += 1;
          flagCounter.innerHTML = buttonFlagCounter;
          let currTileIndex = gameState.flaggedTilesValue.findIndex(i => i === nextTileValue);
          gameState.flaggedTilesValue.splice(currTileIndex, 1);
          currTileIndex = clientFlags.findIndex(i => i === nextTileValue);
          clientFlags.splice(currTileIndex, 1);
          updateFlagsToServer();
        }
        sendGameStateToServer();

        // if (tiles[nextTileValue].getAttribute("rightClicked") === "true" && !clientFlags.includes(parseInt(tiles[nextTileValue].dataset.value))) {
        //   // console.log(`Flag ${tiles[nextTileValue].dataset.value} does not belong to ${clientUsername}`);
        //   tiles[nextTileValue].setAttribute("rightClicked", "false");
        //   let currTileIndex = gameState.flaggedTilesValue.findIndex(i => i === nextTileValue);
        //   gameState.flaggedTilesValue.splice(currTileIndex, 1);
        //   sendGameStateToServer();
        //   removeFlagsForOtherClient.push(parseInt(tiles[nextTileValue].dataset.value));
        //   if (socket.readyState === WebSocket.OPEN) {
        //     socket.send(JSON.stringify({
        //       method: "removeFlagsForOtherClient",
        //       flagValuesToRemove: removeFlagsForOtherClient,
        //       serverId: serverId,
        //       clientId: clientId
        //     }))
        //   }
        // }
        // else if (tiles[nextTileValue].getAttribute("rightClicked") === "true") {
        //   tiles[nextTileValue].setAttribute("rightClicked", "false");
        //   tiles[nextTileValue].innerHTML = "";
        //   if (clientFlags.includes(parseInt(tiles[nextTileValue].dataset.value))) {
        //     let currTileIndex = gameState.flaggedTilesValue.findIndex(i => i === nextTileValue);
        //     gameState.flaggedTilesValue.splice(currTileIndex, 1);
        //     sendGameStateToServer();
        //     buttonFlagCounter += 1;
        //     flagCounter.innerHTML = buttonFlagCounter;
        //     currTileIndex = clientFlags.findIndex(i => i === nextTileValue);
        //     clientFlags.splice(currTileIndex, 1);
        //     updateFlagsToServer();
        //   }
        // }

        scanMineRadius(tiles[nextTileValue]);
        if (tiles[nextTileValue].innerHTML === "") {
          floodFill(tiles[nextTileValue]);
        }
      }
    }
  }
}

function leftClick() {
  let currTile = this;
  // return if currTile is right clicked (flagged); otherwise proceed
  if (currTile.getAttribute("rightClicked") === "true" || gameOver) { return; }
  if (gameState.randomMines.includes(parseInt(currTile.dataset.value))) {
    gameLost();
    return;
  }
  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    visitedTiles.push(currTile);  // this prevents currTile from being pushed more than once (ex. if user clicks too fast)
    gameState.visitedTilesValue.push(parseInt(currTile.dataset.value));
  }
  // console.log(`[LEFT CLICK]` + " on tile " + currTile.dataset.value);
  document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
  currTile.style.backgroundColor = "#707070"; //gray=808080
  scanMineRadius(currTile);
  currTile.removeEventListener("click", leftClick);

  if (currTile.innerHTML === "") {
    floodFill(currTile);
  }

  if (document.querySelectorAll("td").length - gameState.visitedTilesValue.length === gameState.numMines) {
    gameWon();
  }

  gameState.visitedTilesValue = gameState.visitedTilesValue;
  // console.log(gameState.visitedTilesValue);
  sendGameStateToServer();
}

const rightClickHandler = (event) => {
  event.preventDefault();
  // If game is over, ignore right click feature 
  if (gameOver) { return; }
  let currTile = event.target;

  // let valueVisitedTiles = [];
  // if (Number.isInteger(visitedTiles[0])) {
  //   valueVisitedTiles = visitedTiles;
  // } else {
  //   valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  // }

  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      currTile.innerHTML = "<img src='./img/flag-icon.png' alt='flag'>";
      // currTile.style.backgroundColor = "orange";
      currTile.setAttribute("rightClicked", "true");
      buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
      // update the gamestate
      gameState.flaggedTilesValue.push(parseInt(currTile.dataset.value));
      clientFlags.push(parseInt(currTile.dataset.value));
    } else {
      document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/nervous-icon.png' alt='buddy-nervous'>";
      setTimeout(() => {
        document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
      }, 600);
      currTile.innerHTML = "";
      // currTile.style.backgroundColor = "lightgray";
      currTile.setAttribute("rightClicked", "false");
      if (clientFlags.includes(parseInt(currTile.dataset.value))) {
        buttonFlagCounter += 1;
        document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
        let currTileIndex = clientFlags.findIndex(i => parseInt(i) === parseInt(currTile.dataset.value));
        clientFlags.splice(currTileIndex, 1);
      } else { // player removed other player's flag
        console.log(`remove flag ${currTile.dataset.value} for other player`);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            method: "removeFlagForOtherClient",
            flagValueToRemove: parseInt(currTile.dataset.value),
            serverId: serverId,
            clientId: clientId
          }))
        }
      }
      // update the gamestate
      let currTileIndex = gameState.flaggedTilesValue.findIndex(i => parseInt(i) === parseInt(currTile.dataset.value));
      gameState.flaggedTilesValue.splice(currTileIndex, 1);
      // currTileIndex = clientFlags.findIndex(i => parseInt(i) === parseInt(currTile.dataset.value));
      // clientFlags.splice(currTileIndex, 1);
    }
    updateFlagsToServer();
    sendGameStateToServer();
  }
};

function paintContainerGrids() {
  const sidebar = document.querySelector("#sidebar");
  const gameBoard = document.querySelector("#gameBoard");
  gameBoard.onselectstart = function() {  // prevent gameBoard contents from being highlighted
    return false;
  }
  const bgCol = getComputedStyle(document.body).backgroundColor;
  // bgCol = "rgb(r,g,b)"
  const r = bgCol.split(",")[0].split("(")[1];
  const g = bgCol.split(",")[1];
  const b = bgCol.split(",")[2].split(")")[0];
  sidebar.style.backgroundColor = "rgb(" + (parseInt(r) - 70) + "," + (parseInt(g) - 70) + "," + (parseInt(b) - 70) + ")";
  gameBoard.style.backgroundColor = "rgb(" + (parseInt(r) - 40) + "," + (parseInt(g) - 40) + "," + (parseInt(b) - 40) + ")";
}

function generateBg() {
  let r = Math.floor(Math.random() * 200);
  let g = Math.floor(Math.random() * (200 - 120) + 120);  // random # b/w [120-200)
  let b = Math.floor(Math.random() * (200 - 120) + 120);
  document.body.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
  console.log("backgroundColor: " + "rgb(" + r + "," + g + "," + b + ")");
  paintContainerGrids();
}

// Changing selected difficulty
const selectDifficulty = document.querySelector("#choice");
selectDifficulty.addEventListener("change", () => {
  playAgain();
  generateBg();
});

function createFlagButton() {
  const gameBoard = document.querySelector("#gameBoard");
  const fButton = document.createElement("button");
  const fCounter = document.createElement("span");
  const fCounterValue = document.createTextNode(numMines);
  fCounter.appendChild(fCounterValue);
  fButton.appendChild(fCounter);
  gameBoard.append(fButton);
  fButton.classList.add("flagButton");
  fCounter.classList.add("flagCounter");
  fButton.addEventListener("click", flagButtonClick);
  fButton.setAttribute("flagButtonClicked", false);
}

function flagButtonClick() {
  // If game is over, ignore flag button feature
  if (gameOver) { return; }
  const flagButton = this;
  const tdElements = document.querySelectorAll("td");
  if (flagButton.getAttribute("flagButtonClicked") === "false") {
    // console.log(`[FLAG BUTTON CLICKED]`);
    flagButton.setAttribute("flagButtonClicked", true);
    flagButton.style.backgroundColor = "#707070";
    tdElements.forEach(td => {
      if (!visitedTiles.includes(td.dataset.value)) {
        td.removeEventListener("click", leftClick);
        td.addEventListener("click", setFlagHandler);
      }
    });
  } else {
    flagButton.setAttribute("flagButtonClicked", false);
    flagButton.style.backgroundColor = "lightgray";
    tdElements.forEach(td => {
      if (!visitedTiles.includes(td.dataset.value)) {
        td.removeEventListener("click", setFlagHandler);
        td.addEventListener("click", leftClick);
      }
    });
  }
}

// setFlagHandler() should work in tandem with rightClickHandler()
function setFlagHandler() {
  if (gameOver) { return; }
  let currTile = this;
  // let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      currTile.innerHTML = "<img src='./img/flag-icon.png' alt='flag'>";
      // currTile.style.backgroundColor = "orange";
      currTile.setAttribute("rightClicked", true);
      buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
      // update the gamestate
      gameState.flaggedTilesValue.push(parseInt(currTile.dataset.value));
    } else {
      document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/nervous-icon.png' alt='buddy-nervous'>";
      setTimeout(() => {
        document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
      }, 600);
      currTile.innerHTML = "";
      // currTile.style.backgroundColor = "lightgray";
      currTile.setAttribute("rightClicked", false);
      buttonFlagCounter += 1;
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
      // update the gamestate
      let currTileIndex = gameState.flaggedTilesValue.findIndex(i => parseInt(i) === parseInt(currTile.dataset.value));
      gameState.flaggedTilesValue.splice(currTileIndex, 1);
    }
    sendGameStateToServer();
  }
}

function createBuddy() {
  const bButton = document.createElement("button");
  bButton.innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
  bButton.classList.add("buddyButton");
  bButton.addEventListener("click", buddyButtonClick);
  const gameBoard = document.querySelector("#gameBoard");
  gameBoard.insertBefore(bButton, gameBoard.querySelector("#gameWindow"));
}

function buddyButtonClick() {
  if (gameOver) {
    playAgain();
  }
}

function createPlayAgainButton() {
  const playAgainButton = document.createElement("button");
  const textSpan = document.createElement("span");
  const playAgainText = document.createTextNode("Play Again");
  textSpan.appendChild(playAgainText)
  playAgainButton.appendChild(textSpan);
  const gameBoard = document.querySelector("#gameBoard");
  gameBoard.append(playAgainButton);
  playAgainButton.classList.add("playAgainButton");
  playAgainButton.addEventListener("click", playAgain);
}

function gameLost() {
  gameOver = true;
  console.log(`[GAME OVER]`);
  document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/dizzy-icon.png' alt='buddy-dizzy'>";
  let tdElements = document.querySelectorAll("td");
  randomMines.forEach(td => {
    tdElements[td].innerHTML = "<img src='./img/bomb-icon.png' alt='bomb'>";
    tdElements[td].style.backgroundColor = "brown";
    if (tdElements[td].getAttribute("rightClicked") === "true") {
      tdElements[td].innerHTML += "<img class='flagOnMine' src='./img/flag-icon.png' alt='flag'>";
    }
  });
  tdElements.forEach(td => {
    td.removeEventListener("click", leftClick);
  });
  createPlayAgainButton();
}

function gameWon() {
  gameOver = true;
  console.log(`[GAME WON]`);
  document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/chill-icon.png' alt='buddy-chill'>";
  let tdElements = document.querySelectorAll("td");
  tdElements.forEach(td => {
    td.removeEventListener("click", leftClick);
  });
  createPlayAgainButton();
}

function playAgain() {
  console.clear();
  gameOver = false;
  numMines = 0;
  randomMines = [];
  visitedTiles = [];
  gameState.numMines = 0;
  gameState.randomMines = [];
  gameState.visitedTiles = [];
  gameState.flaggedTilesValue = [];
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  document.querySelector(".buddyButton").remove();
  document.querySelector(".flagButton").remove();
  if (selectDifficulty.value === "easy") {
    generateEasy(true);
  } else if (selectDifficulty.value === "medium") {
    generateMedium(true);
  } else {
    generateHard(true);
  }
}

function sendGameStateToServer() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      method: "updateGameState",
      gameState: gameState,
      serverId: serverId,
      clientId: clientId
    }))
  }
}

function updateFlagsToServer() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      method: "updateFlags",
      flags: clientFlags,
      serverId: serverId,
      clientId: clientId
    }))
  }
}

function updateJoiningClientBoard() {
  console.log(`Updating board for the joining client: ${clientUsername}`);
  let tiles = document.querySelectorAll("td");

  // if initialClick() was already executed by other client, remove it for the joining client
  if (gameState.visitedTilesValue.length > 0) {
    tiles.forEach(t => {
      t.removeEventListener("click", initialClick);
      if (gameState.visitedTilesValue.includes(parseInt(t.dataset.value))) {
        t.removeEventListener("click", leftClick);
        t.style.backgroundColor = "#707070";
        scanMineRadius(t);
      } else {
        t.addEventListener("click", leftClick);
      }
    });
  }

  // if they exist, place other client's flags on client's board 
  if (gameState.flaggedTilesValue.length > 0) {
    gameState.flaggedTilesValue.forEach(flagValue => {
      tiles[flagValue].innerHTML = "<img src='./img/blueflag-icon.png' alt='blueflag'>";
      tiles[flagValue].setAttribute("rightClicked", true);
    })
  }
}

 



function updateClientBoard(data) {  
  console.log(`updateClientBoard(${data.method}) for ${clientUsername}`);
  randomMines = gameState.randomMines;
  let tiles = document.querySelectorAll("td");
  
  switch (data.method) {
    case "updateFlagsForOtherClient": // whenever a client adds or removes their own flag
      tiles.forEach(td => {
        if (gameState.visitedTilesValue.includes(parseInt(td.dataset.value)) || clientFlags.includes(parseInt(td.dataset.value))) {
          return;
        }
        if (data.otherClientFlags.includes(parseInt(td.dataset.value))) {
          td.innerHTML = "<img src='./img/blueflag-icon.png' alt='blueflag'>";
          td.setAttribute("rightClicked", true);
        } else {
          td.innerHTML = "";
          td.setAttribute("rightClicked", false);
        }
      })
      break;
  }

  // gameState.visitedTilesValue.forEach(tileValue => {
  //   tiles[tileValue].innerHTML = "";
  //   tiles[tileValue].style.backgroundColor = "#707070";
  //   tiles[tileValue].removeEventListener("click", leftClick);
  //   tiles[tileValue].removeEventListener("click", rightClickHandler);
  //   scanMineRadius(tiles[tileValue]);
  // })
  // if (gameState.visitedTilesValue.length > 0){ // if initialClick() was already executed by other client, remove it for the joining client
  //   tiles.forEach(td => {
  //     td.removeEventListener("click", initialClick);
  //     td.addEventListener("click", leftClick);
  //   })
  // }

  // tiles.forEach(td => {
  //   // let td = document.querySelector(`[data-value="${parseInt(t.dataset.value)}"]`);
  //   if (gameState.flaggedTilesValue.includes(parseInt(td.dataset.value))) {
  //     td.innerHTML = "<img src='./img/blueflag-icon.png' alt='blueflag'>";
  //     td.setAttribute("rightClicked", true);
  //   } else {
  //     td.innerHTML = "";
  //     td.setAttribute("rightClicked", false);
  //   }
  // })

  // if (gameState.visitedTilesValue.length > 0) {  // if initialClick() was already executed by other client, remove it for the joining client
  //   tiles.forEach(t => {
  //     t.removeEventListener("click", initialClick);
  //     t.addEventListener("click", leftClick);
  //   });
  // }
  // for (tileValue in gameState.visitedTilesValue) {
  //   let td = document.querySelector(`[data-value="${gameState.visitedTilesValue[tileValue]}"]`);
  //   td.style.backgroundColor = "#707070";
  //   scanMineRadius(td);
  //   td.removeEventListener("click", leftClick);
  //   td.removeEventListener("click", rightClickHandler);
    
  // }
  
  // let nonVisitedTilesValue = [];
  // tiles.forEach(t => {
  //   if (!gameState.visitedTilesValue.includes(parseInt(t.dataset.value))) {
  //     nonVisitedTilesValue.push(parseInt(t.dataset.value));
  //   }
  // })
  // // console.log(nonVisitedTilesValue);
}



generateEasy(true);