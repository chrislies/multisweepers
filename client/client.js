const gw = document.querySelector("#gameWindow");
const gameBoard = document.querySelector("#gameBoard");
gw.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
gameBoard.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
let playerCount = document.querySelector("#playerCount");
let playerList = document.querySelector("#playerList");
let leaderboard = document.querySelector("#leaderboard tbody");
let flagCounter = document.querySelector(".flagCounter");
let span;

let socket;
let clientId;
let serverId;
let clientUsername;
let clientFlags = [];
let spectate = false;
let buttonFlagCounter = 0;
let wins = 0;

let gameState = {
  multiplayer: false,
  enableJoining: true,
  gameOver: false,
  playersSpectating: 0,
  visitedTilesValue: [],
  flaggedTilesValue: [],
  buttonFlagCounter: 0,
  numMines: 0,
  randomMines: [],
  gameDifficulty: "",
  possibleMove: [],
  mineRadiusNB: [],
  mineRadiusLB: [],
  mineRadiusRB: [],
};

function isMobile() {
  let innerWidth = window.innerWidth;
  return innerWidth <= 768;
}
// console.log(`isMobile = ${isMobile()}`);

let serverListButton = document.querySelector("#serverListButton");
let serverList = document.querySelector("#servers");

serverListButton.addEventListener("click", (event) => {
  serverListButton.classList.toggle("active");
  serverList.classList.toggle("active");
});

document.addEventListener("click", (event) => {
  if (
    serverList.classList.contains("active") &&
    event.target !== serverListButton &&
    !serverList.contains(event.target)
  ) {
    serverListButton.classList.remove("active");
    serverList.classList.remove("active");
  }
});

serverList.addEventListener("click", (event) => {
  if (Number.isInteger(parseInt(event.target.innerText))) {
    document.querySelector("#serverCodeInput").value =
      event.target.innerText.slice(0, 4);
  } else {
    serverListButton.classList.remove("active");
    serverList.classList.remove("active");
  }
});

// Prevent clicks inside the server list from closing it
serverList.addEventListener("click", (event) => {
  event.stopPropagation();
});

let enableJoinSwitch = document.querySelector("#enableJoinSwitch input");
enableJoinSwitch.addEventListener("click", (event) => {
  if (event.target.checked) {
    gameState.enableJoining = true;
  } else {
    // unchecked enable joining
    gameState.enableJoining = false;
  }
  sendGameStateToServer();
});

let joinServerButton = document.querySelector("#joinServerButton");
joinServerButton.addEventListener("click", (event) => {
  event.preventDefault();
  if (enableJoinSwitch.checked == false) {
    alert("Enable multiplayer to join other servers!");
    return;
  }
  let serverCode = document.querySelector("#serverCodeInput").value.trim();
  wins = 0; // reset client wins whenever they join a new server
  const payLoad = {
    method: "joinServer",
    clientId: clientId,
    serverId: serverCode, // the requested serverId
    oldServerId: serverId,
    username: clientUsername,
  };
  socket.send(JSON.stringify(payLoad));
});

const chatBtn = document.querySelector(".chatButton");
const chatGUI = document.querySelector(".chatGUI");
const minimizeChatBtn = document.querySelector(".minimizeChatButton");
const chatBox = document.querySelector(".chatBox");
const chatBoxBtn = document.querySelector("#chatBoxButton");
const chatBoxMessages = document.querySelector(".chatBoxMessages");
const chatBoxInput = document.querySelector("#chatBoxInput");
const chatNotifyIcon = document.querySelector(".chatNotifyIcon");
let chatNotifyCounter = 0;

chatBoxBtn.addEventListener("click", (event) => {
  event.preventDefault();
  if (chatBoxInput.value.trim() != "") {
    let chatMsg = chatBoxInput.value;
    chatBoxInput.value = "";
    chatBoxInput.focus();
    let chatMsgLi = document.createElement("li");
    chatMsgLi.classList.add("chatMessage", "client");
    chatMsgLi.innerText = chatMsg;
    chatBoxMessages.appendChild(chatMsgLi);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to most recent chat message

    // update chat message to the server and send to other client (if there exists)
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          method: "storeChatMessage",
          chatMessage: chatMsg,
          serverId: serverId,
          clientId: clientId,
        })
      );
    }
  }
});

function toggleChatGUI() {
  chatBtn.classList.toggle("active");
  chatGUI.style.display = chatGUI.style.display === "none" ? "flex" : "none";
  chatNotifyCounter = 0; // Reset chat notify icon counter
  chatNotifyIcon.style.display = "none";
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to most recent chat message
}

chatBtn.addEventListener("click", toggleChatGUI);
minimizeChatBtn.addEventListener("click", toggleChatGUI);

socket = new WebSocket("wss://multisweepers.onrender.com");
// socket = new WebSocket("ws://localhost:8080");
socket.onmessage = onMessage;

function onMessage(msg) {
  let tiles = document.querySelectorAll("#gameWindow td");
  const data = JSON.parse(msg.data);
  switch (data.method) {
    case "connected":
      console.log("Client connected");
      clientId = data.clientId;
      serverId = data.serverId;
      console.log(`Server id = ${serverId}`);
      serverCode.innerHTML = serverId;
      let tr = document.createElement("tr");
      tr.classList.add("leaderboard-player");
      tr.setAttribute("id", "clientUsername");
      let tdPlayer = document.createElement("td");
      tdPlayer.classList.add("name");
      let tdPlayerWins = document.createElement("td");
      tdPlayerWins.classList.add("wins");
      tdPlayer.innerText = data.username;
      tdPlayerWins.innerText = 0;
      tr.appendChild(tdPlayer);
      tr.appendChild(tdPlayerWins);
      document.querySelector("tbody").appendChild(tr);
      clientUsername = data.username;
      gameState.visitedTilesValue = gameState.visitedTilesValue;
      gameState.numMines = gameState.numMines;
      gameState.randomMines = gameState.randomMines;
      gameState.gameDifficulty = gameState.gameDifficulty;
      gameState.buttonFlagCounter = gameState.buttonFlagCounter;
      // Send the updated gameState to the server with the function below
      sendGameStateToServer();
      chatMsgLi = document.createElement("li");
      chatMsgLi.classList.add("chatMessage", "status");
      chatMsgLi.innerHTML = `${clientUsername} <strong class=joined>joined</strong> server ${serverId}`;
      chatBoxMessages.appendChild(chatMsgLi);
      break;
    case "updateServersList":
      // Clear the existing server list
      while (serverList.firstChild) {
        serverList.removeChild(serverList.lastChild);
      }
      const servers = data.list;
      servers.forEach((server) => {
        if (server.serverId == serverId && servers.length === 1) {
          let li = document.createElement("h1");
          li.innerHTML = "No other servers";
          serverList.appendChild(li);
          return;
        } else if (server.serverId != serverId && servers.length > 1) {
          let li = document.createElement("h1");
          li.innerHTML = `${server.serverId} [${server.playerCount}/2]`;
          serverList.appendChild(li);
        }
      });
      break;
    case "alreadyInServer":
      alert(`Already in server "${data.serverId}"`);
      break;
    case "serverIsFull":
      alert(`Server "${data.serverId}" is full!`);
      break;
    case "serverDisabledJoining":
      alert(`Server "${data.serverId}" disabled multiplayer!`);
      break;
    case "joinedServer":
      console.log(`Player ${data.player} joined server "${data.serverId}"`);
      // console.log(data)
      gameState.multiplayer = true;
      spectate = false;
      serverId = data.serverId;
      serverCode.innerHTML = data.serverId;

      // log stuts to the chat box
      // chatMsgLi = document.createElement("li");
      // chatMsgLi.classList.add("chatMessage", "status");
      // chatMsgLi.innerHTML = `${data.player} <strong class=joined>joined</strong> server ${data.serverId}`;
      // chatBoxMessages.appendChild(chatMsgLi);

      // clear existing leaderboard
      while (leaderboard.firstChild) {
        leaderboard.removeChild(leaderboard.firstChild);
      }
      let clientUsernameElement; // store a reference to the client's username element
      for (const playerName in data.usernameList) {
        let tr = document.createElement("tr");
        tr.classList.add("leaderboard-player");
        let tdPlayer = document.createElement("td");
        let tdPlayerWins = document.createElement("td");
        tdPlayer.classList.add("name");
        tdPlayer.innerText = data.usernameList[playerName];
        tdPlayerWins.classList.add("wins");
        tdPlayerWins.innerText = data.otherClientWins; // other client's wins
        tr.appendChild(tdPlayer);
        tr.appendChild(tdPlayerWins);
        leaderboard.append(tr);
        if (data.usernameList[playerName] === clientUsername) {
          tr.setAttribute("id", "clientUsername");
          clientUsernameElement = tr;
          tdPlayerWins.innerText = wins;
        }
      }
      // rearrange player leaderboard so that the client's username is first
      leaderboard.prepend(clientUsernameElement);

      // update player's gameboard to new server's gameboard
      // update the new player's gamestate
      if (data.gameDifficulty) {
        console.log(`${data.player} w/ difficulty ${data.gameDifficulty}`);
        difficulty = data.gameDifficulty;
        gameState.gameDifficulty = data.gameDifficulty;
        selectDifficulty.value = data.gameDifficulty;
        switch (data.gameDifficulty) {
          case "easy":
            generateEasy(data.sendToServer);
            // generateEasy();
            break;
          case "medium":
            // generateMedium(data.sendToServer);
            generateMedium();
            break;
          case "hard":
            // generateHard(data.sendToServer);
            generateHard();
            break;
        }
        clientFlags = data.clientFlags;
        gameState.playersSpectating = data.playersSpectating;
        gameState.visitedTilesValue = data.visitedTilesValue;
        gameState.flaggedTilesValue = data.flaggedTilesValue;
        gameState.buttonFlagCounter = data.buttonFlagCounter;
        document.querySelector(".flagCounter").innerHTML =
          data.buttonFlagCounter;
        gameState.randomMines = data.randomMines;
        gameState.numMines = data.numMines;
        gameState.possibleMove = data.possibleMove;
        gameState.mineRadiusNB = data.mineRadiusNB;
        gameState.mineRadiusLB = data.mineRadiusLB;
        gameState.mineRadiusRB = data.mineRadiusRB;
        updateJoiningClientBoard();
      }
      break;
    case "serverDNE":
      alert(`Server "${data.serverId}" does not exist!`);
      break;
    case "updateChat":
      updateChat(data);
      break;
    case "updatePlayersList": // when a user DISCONNECTS/LEAVES from a full server
      // clear the existing player list/leaderboard
      while (leaderboard.firstChild) {
        leaderboard.removeChild(leaderboard.firstChild);
      }
      // add players to the player list
      for (const playerName in data.updatedPlayerList) {
        let tr = document.createElement("tr");
        tr.classList.add("leaderboard-player");
        tr.setAttribute("id", "clientUsername");
        let tdPlayer = document.createElement("td");
        let tdPlayerWins = document.createElement("td");
        tdPlayer.classList.add("name");
        tdPlayer.innerText = data.updatedPlayerList[playerName];
        tdPlayerWins.classList.add("wins");
        tdPlayerWins.innerText = wins;
        tr.appendChild(tdPlayer);
        tr.appendChild(tdPlayerWins);
        leaderboard.append(tr);
      }
      gameState.multiplayer = false;
      data.newClientFlags.forEach((flag) => {
        clientFlags.push(flag);
      });
      gameState.playersSpectating = data.playersSpectating;
      break;
    case "removedFlagForOtherClient":
      // whenever a client removes other client's flag
      updateClientBoard(data);
      break;
    case "removedFlagsForOtherClient":
      // whenever other client's flags are removed by initialClick() or floodFill()
      updateClientBoard(data);
      break;
    case "updateFlagsForOtherClient":
      // whenever either client adds or removes their own flag
      updateClientBoard(data);
      break;
    case "updateGameState":
      // console.log(`Updating game state for player ${data.otherClient}`);
      gameState.gameOver = data.gameOver;
      gameState.enableJoining = data.enableJoining;
      gameState.playersSpectating = data.playersSpectating;
      gameState.visitedTilesValue = data.visitedTilesValue;
      gameState.flaggedTilesValue = data.flaggedTilesValue;
      gameState.buttonFlagCounter = data.buttonFlagCounter;
      gameState.randomMines = data.randomMines;
      gameState.numMines = data.numMines;
      gameState.possibleMove = data.possibleMove;
      gameState.mineRadiusNB = data.mineRadiusNB;
      gameState.mineRadiusLB = data.mineRadiusLB;
      gameState.mineRadiusRB = data.mineRadiusRB;

      gameState.enableJoining == true
        ? (enableJoinSwitch.checked = true)
        : (enableJoinSwitch.checked = false);

      if (gameState.gameOver == true && gameState.playersSpectating === 2) {
        gameState.randomMines.forEach((td) => {
          tiles[td].innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
          tiles[td].style.backgroundColor = "#830000";
          if (tiles[td].getAttribute("rightClicked") === "true") {
            clientFlags.includes(parseInt(tiles[td].dataset.value))
              ? (tiles[td].innerHTML +=
                  "<img class='flagOnMine' src='../img/flag-icon.png' alt='flag'>")
              : (tiles[td].innerHTML +=
                  "<img class='flagOnMine' src='../img/blueflag-icon.png' alt='flag'>");
          }
        });
        createPlayAgainButton();
      }
      break;
    case "updateGameState_InitialClick":
      updateClientBoard(data);
      break;
    case "updateVisitedTilesForOtherClient":
      updateClientBoard(data);
      break;
    case "clearGameState":
      gameState.playersSpectating = data.gameState.playersSpectating;
      gameState.visitedTilesValue = data.gameState.visitedTilesValue;
      gameState.flaggedTilesValue = data.gameState.flaggedTilesValue;
      gameState.randomMines = data.gameState.randomMines;
      gameState.possibleMove = data.gameState.possibleMove;
      gameState.mineRadiusNB = data.gameState.mineRadiusNB;
      gameState.mineRadiusLB = data.gameState.mineRadiusLB;
      gameState.mineRadiusRB = data.gameState.mineRadiusRB;
      // console.log(gameState, `cleared`);
      break;
    case "generateGameForOtherClient":
      spectate = false;
      clientFlags = [];
      switch (data.gameDifficulty) {
        case "easy":
          generateEasy();
          selectDifficulty.value = "easy";
          break;
        case "medium":
          generateMedium();
          selectDifficulty.value = "medium";
          break;
        case "hard":
          generateHard();
          selectDifficulty.value = "hard";
          break;
      }
      break;
    case "foundMine":
      let mine = document.querySelector(`[data-value="${data.mineValue}"]`);
      mine.innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
      mine.style.backgroundColor = "#830000";
      break;
    case "handleGameWon":
      if (data.gameOver == true) {
        if (!spectate) {
          // player is safe
          console.log("[GAME WON]");
          wins += 1;
          document.querySelector("#clientUsername .wins").innerText = wins;
          document.querySelector(".buddyButton").innerHTML =
            "<img class='buddyImg' src='../img/chill-icon.png' alt='buddy-chill'>";
          sendClientWinsToServer();
        }
        let tdElements = document.querySelectorAll("#gameWindow td");
        tdElements.forEach((td) => {
          td.removeEventListener("click", leftClick);
        });
        createPlayAgainButton();
      }
      break;
    case "updateClientWins":
      updateClientBoard(data);
      break;
    case "updateClientSpectate":
      if (data.playersSpectating === 2) {
        console.log("Both players now spectating!");
      }
      break;
  }
}

function generateEasy(sendToServer) {
  gameState.gameOver = false;
  gameState.gameDifficulty = "easy";
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
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  let n = 9; // n x n grid
  createFlagButton();
  gameState.numMines = 10;
  gameState.buttonFlagCounter = gameState.numMines;
  document.querySelector(".flagCounter").innerHTML =
    gameState.buttonFlagCounter;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile", tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      data.addEventListener("mousedown", mouseDownHandler);
      data.addEventListener("mouseup", mouseUpHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  createBuddy();
  generateBg();
  paintContainerGrids();
  if (sendToServer) {
    sendGameStateToServer();
  }
}

function generateMedium(sendToServer) {
  gameState.gameOver = false;
  gameState.gameDifficulty = "medium";
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
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  let n = 16; // n x n grid
  createFlagButton();
  gameState.numMines = 40;
  gameState.buttonFlagCounter = gameState.numMines;
  document.querySelector(".flagCounter").innerHTML =
    gameState.buttonFlagCounter;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile", tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      data.addEventListener("mousedown", mouseDownHandler);
      data.addEventListener("mouseup", mouseUpHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  createBuddy();
  generateBg();
  paintContainerGrids();
  if (sendToServer) {
    sendGameStateToServer();
  }
}

function generateHard(sendToServer) {
  gameState.gameOver = false;
  gameState.gameDifficulty = "hard";
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
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  let n = 16; // n x m grid
  let m = 30;
  createFlagButton();
  gameState.numMines = 99;
  gameState.buttonFlagCounter = gameState.numMines;
  document.querySelector(".flagCounter").innerHTML =
    gameState.buttonFlagCounter;
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < m; j++) {
      let data = document.createElement("td");
      data.classList.add("tile", tileCounter);
      data.dataset.value = tileCounter;
      data.setAttribute("rightClicked", "false");
      data.addEventListener("click", initialClick);
      data.addEventListener("contextmenu", rightClickHandler);
      data.addEventListener("mousedown", mouseDownHandler);
      data.addEventListener("mouseup", mouseUpHandler);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
  createBuddy();
  generateBg();
  paintContainerGrids();
  if (sendToServer) {
    sendGameStateToServer();
  }
}

function initialClick() {
  // clear x surrounding tiles upon inital click on one of the tiles
  // if flag button is clicked, return; otherwise proceed
  if (
    document.querySelector(".flagButton").getAttribute("flagButtonClicked") ===
    "true"
  ) {
    return;
  }
  document.querySelector(".buddyButton").innerHTML =
    "<img class='buddyImg' src='../img/shocked-icon.png' alt='buddy-shocked'>";
  setTimeout(() => {
    document.querySelector(".buddyButton").innerHTML =
      "<img class='buddyImg' src='../img/smile-icon.png' alt='buddy-smile'>";
  }, 400);
  let initialTile = this;
  gameState.visitedTilesValue.push(parseInt(initialTile.dataset.value));
  let tableSize = document.getElementsByClassName("tile").length - 1; // get the last td element to determine tableSize
  let numRandomTiles = 0;
  switch (gameState.gameDifficulty) {
    case "easy":
      gameState.numMines = 10;
      gameState.possibleMove = [9, 1, -9, -1]; // can either move [up,right,down,left] by adding possibleMove[x] current tile
      gameState.mineRadiusNB = [-10, -9, -8, -1, 1, 8, 9, 10]; // possible mine locations for each NON-BORDER tile
      gameState.mineRadiusLB = [-9, -8, 1, 9, 10]; // possible mine locations for each left border tile
      gameState.mineRadiusRB = [-10, -9, -1, 8, 9]; // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (25 - 8) + 8); // generate random # between [8-25)
      console.log(
        "[easy: initial click] Number of random tiles: " + numRandomTiles
      );
      break;
    case "medium":
      gameState.numMines = 40;
      gameState.possibleMove = [16, 1, -16, -1]; // can either move [up,right,down,left] by adding possibleMove[x] current tile
      gameState.mineRadiusNB = [-17, -16, -15, -1, 1, 15, 16, 17]; // possible mine locations for each NON-BORDER tile
      gameState.mineRadiusLB = [-16, -15, 1, 16, 17]; // possible mine locations for each left border tile
      gameState.mineRadiusRB = [-17, -16, -1, 15, 16]; // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (34 - 17) + 17); // generate random # between [17-34)
      console.log(
        "[medium: initial click] Number of random tiles: " + numRandomTiles
      );
      break;
    case "hard":
      gameState.numMines = 99;
      gameState.possibleMove = [30, 1, -30, -1]; // can either move [up,right,down,left] by adding possibleMove[x] current tile
      gameState.mineRadiusNB = [-31, -30, -29, -1, 1, 29, 30, 31]; // possible mine locations for each NON-BORDER tile
      gameState.mineRadiusLB = [-30, -29, 1, 30, 31]; // possible mine locations for each left border tile
      gameState.mineRadiusRB = [-31, -30, -1, 29, 30]; // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (48 - 31) + 31); // generate random # between [31-48)
      console.log(
        "[hard: initial click] Number of random tiles: " + numRandomTiles
      );
      break;
  }
  while (gameState.visitedTilesValue.length < numRandomTiles) {
    let randomMove = Math.round(Math.random() * 3);
    let nextTileValue =
      parseInt(initialTile.dataset.value) + gameState.possibleMove[randomMove];
    let nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
    while (
      nextTileValue === null ||
      nextTileValue < 0 ||
      nextTileValue >= tableSize
    ) {
      randomMove = Math.round(Math.random() * 3);
      nextTileValue =
        parseInt(initialTile.dataset.value) +
        gameState.possibleMove[randomMove];
      nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
    }
    while (
      gameState.visitedTilesValue.includes(nextTileValue) ||
      nextTile === initialTile
    ) {
      // add check for nextTile not being initialTile and not already visited
      randomMove = Math.round(Math.random() * 3);
      nextTileValue += gameState.possibleMove[randomMove];
      nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
      while (
        nextTileValue === null ||
        nextTileValue < 0 ||
        nextTileValue >= tableSize
      ) {
        randomMove = Math.round(Math.random() * 3);
        nextTileValue =
          parseInt(initialTile.dataset.value) +
          gameState.possibleMove[randomMove];
        nextTile = document.querySelector(`[data-value="${nextTileValue}"]`);
      }
    }
    gameState.visitedTilesValue.push(nextTileValue);
  }
  // Generate mines
  let tiles = document.querySelectorAll("#gameWindow td");
  while (gameState.randomMines.length < gameState.numMines) {
    let randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    while (
      gameState.randomMines.includes(randomNum) ||
      gameState.visitedTilesValue.includes(randomNum)
    ) {
      randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    }
    gameState.randomMines.push(randomNum);
    tiles[randomNum].style.backgroundColor = "red";
  }

  gameState.visitedTilesValue.forEach((tileVal) => {
    tiles[tileVal].style.backgroundColor = "#707070";
    if (
      tiles[tileVal].getAttribute("rightClicked") === "true" ||
      gameState.flaggedTilesValue.includes(tileVal)
    ) {
      tiles[tileVal].setAttribute("rightClicked", false);
      tiles[tileVal].innerHTML = "";
      gameState.flaggedTilesValue.splice(
        gameState.flaggedTilesValue.indexOf(tileVal),
        1
      );
      gameState.buttonFlagCounter += 1; // update the total flag counter by 'returning' the flag to the counter
      document.querySelector(".flagCounter").innerHTML =
        gameState.buttonFlagCounter;
      if (clientFlags.includes(tileVal)) {
        clientFlags.splice(clientFlags.indexOf(tileVal), 1);
        updateFlagsToServer(); // send this client's flags values to the other client (in order to update flags properly)
      } else {
        // the current tile is flagged by the other cient; remove other client's flag and update for both clients
        let removeFlagsForOtherClient = [];
        removeFlagsForOtherClient.push(tileVal);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              method: "removeFlagsForOtherClient",
              flagValuesToRemove: removeFlagsForOtherClient,
              serverId: serverId,
              clientId: clientId,
            })
          );
        }
      }
    }
    scanMineRadius(tiles[tileVal]);
    if (tiles[tileVal].innerHTML === "") {
      floodFill(tiles[tileVal]);
    }
  });

  // after doing initial click, for each td element:
  // remove "initialClick" event listener
  // add "leftClick" event listener ONLY IF tile has not been visited
  tiles.forEach((td) => {
    td.removeEventListener("click", initialClick);
    if (isMobile()) {
      td.addEventListener("click", mouseDownHandler);
    }
    if (!gameState.visitedTilesValue.includes(parseInt(td.dataset.value))) {
      td.addEventListener("click", leftClick);
    }
  });

  sendGameStateToServer();
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "updateGameState_InitialClick",
        gameState: gameState,
        clientId: clientId,
        serverId: serverId,
      })
    );
  }
  // console.clear()
  // for (key in gameState) {
  //   console.log(`${key}: ${gameState[key]}`);
  // }
}

function scanMineRadius(tile) {
  let colLength = document.querySelector("#gameWindow tr").children.length; // the number of elements in a row
  let mineCounter = 0;
  let mineRadius = [];
  let tileValue = parseInt(tile.dataset.value);

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, mineRadius becomes limited to mineRadiusLB
    mineRadius = gameState.mineRadiusLB;
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, mineRadius becomes limited to mineRadiusRB
    mineRadius = gameState.mineRadiusRB;
  } else {
    // If current tile is not on either border, mineRadius does not need to be limited
    mineRadius = gameState.mineRadiusNB;
  }
  for (let i = 0; i < mineRadius.length; i++) {
    if (gameState.randomMines.includes(tileValue + mineRadius[i])) {
      mineCounter++;
    }
    if (mineCounter > 0) {
      tile.innerHTML = mineCounter;
      switch (mineCounter) {
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
  let colLength = document.querySelector("#gameWindow tr").children.length; // the number of elements in a row
  let floodRadius = [];
  let tileValue = parseInt(tile.dataset.value);
  let tiles = document.querySelectorAll("#gameWindow td");
  let removeFlagsForOtherClient = [];

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, floodRadius becomes limited to mineRadiusLB
    floodRadius = gameState.mineRadiusLB;
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, floodRadius becomes limited to mineRadiusRB
    floodRadius = gameState.mineRadiusRB;
  } else {
    // If current tile is not on either border, floodRadius does not need to be limited
    floodRadius = gameState.mineRadiusNB;
  }

  for (let i = 0; i < floodRadius.length; i++) {
    let nextTileValue = tileValue + floodRadius[i];
    if (tiles[nextTileValue]) {
      if (!gameState.visitedTilesValue.includes(nextTileValue)) {
        gameState.visitedTilesValue.push(nextTileValue);
        updateVisitedTilesForOtherClient();
        tiles[nextTileValue].style.backgroundColor = "#707070";
        // tiles[nextTileValue].style.backgroundColor = "cyan";
        if (gameState.flaggedTilesValue.includes(nextTileValue)) {
          // console.log(`tile ${nextTileValue} is flagged`);
          tiles[nextTileValue].innerHTML = "";
          tiles[nextTileValue].setAttribute("rightClicked", "false");
          gameState.flaggedTilesValue.splice(
            gameState.flaggedTilesValue.indexOf(nextTileValue),
            1
          );
          let flagCounter = document.querySelector(".flagCounter");
          gameState.buttonFlagCounter += 1;
          flagCounter.innerHTML = gameState.buttonFlagCounter;
          if (clientFlags.includes(nextTileValue)) {
            // unflag the tile for this client
            clientFlags.splice(clientFlags.indexOf(nextTileValue), 1);
            updateFlagsToServer();
          } else {
            // unflag the tile for other client
            removeFlagsForOtherClient.push(nextTileValue);
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(
                JSON.stringify({
                  method: "removeFlagsForOtherClient",
                  flagValuesToRemove: removeFlagsForOtherClient,
                  buttonFlagCounter: gameState.buttonFlagCounter,
                  serverId: serverId,
                  clientId: clientId,
                })
              );
            }
          }
        }
        scanMineRadius(tiles[nextTileValue]);
        // check if game is won (if all safe tiles have been visited)
        if (checkGameWon()) {
          gameWon();
        }
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
  if (currTile.getAttribute("rightClicked") === "true" || gameState.gameOver) {
    return;
  }
  if (gameState.randomMines.includes(parseInt(currTile.dataset.value))) {
    gameLost(parseInt(currTile.dataset.value));
    return;
  }
  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    gameState.visitedTilesValue.push(parseInt(currTile.dataset.value)); // this prevents currTile from being pushed more than once (ex. if user clicks too fast)
  }
  document.querySelector(".buddyButton").innerHTML =
    "<img class='buddyImg' src='../img/smile-icon.png' alt='buddy-smile'>";
  currTile.style.backgroundColor = "#707070"; //gray=808080
  currTile.removeEventListener("click", leftClick);
  scanMineRadius(currTile);
  if (currTile.innerHTML === "") {
    floodFill(currTile);
  }
  if (
    document.getElementsByClassName("tile").length -
      gameState.visitedTilesValue.length ===
    gameState.numMines
  ) {
    gameWon();
  }
  if (gameState.multiplayer) {
    updateVisitedTilesForOtherClient();
  }
  sendGameStateToServer();
}

let leftClicked = false;
let rightClicked = false;
const mouseDownHandler = (event) => {
  if (gameState.gameOver) {
    return;
  }
  if (event.button === 0) {
    leftClicked = true;
  } else if (event.button === 2) {
    rightClicked = true;
  }

  if ((leftClicked && rightClicked) || event.button === 1 || isMobile()) {
    // chord the adjacent tiles
    let currTile = event.target;
    if (currTile.innerText === "") {
      return;
    }
    let currTileVal = parseInt(currTile.dataset.value);
    let colLength = document.querySelector("#gameWindow tr").children.length; // the number of elements in a row
    let chordRadius = [];
    let mineCounter = 0;
    let flagCounter = 0;

    if (currTileVal % colLength === 0) {
      // If current tile is on the left border, chordRadius becomes limited to mineRadiusLB
      chordRadius = gameState.mineRadiusLB;
    } else if (currTileVal % colLength === colLength - 1) {
      // If current tile is on the right border, chordRadius becomes limited to mineRadiusRB
      chordRadius = gameState.mineRadiusRB;
    } else {
      // If current tile is not on either border, chordRadius does not need to be limited
      chordRadius = gameState.mineRadiusNB;
    }

    chordRadius.forEach((value) => {
      let adjacentTile = document.querySelector(
        `[data-value="${currTileVal + value}"]`
      );
      if (adjacentTile) {
        if (
          gameState.randomMines.includes(parseInt(adjacentTile.dataset.value))
        ) {
          mineCounter += 1;
        }
        if (
          gameState.flaggedTilesValue.includes(
            parseInt(adjacentTile.dataset.value)
          )
        ) {
          flagCounter += 1;
        }
      }
    });

    if (mineCounter === flagCounter) {
      // Check if current tile is able to chord/reveal surrounding tiles
      for (const value of chordRadius) {
        let adjacentTile = document.querySelector(
          `[data-value="${currTileVal + value}"]`
        );
        if (adjacentTile) {
          if (
            (!gameState.visitedTilesValue.includes(
              parseInt(adjacentTile.dataset.value)
            ) &&
              gameState.randomMines.includes(
                parseInt(adjacentTile.dataset.value)
              ) &&
              adjacentTile.innerHTML === "") ||
            adjacentTile.innerHTML ===
              "<img src='../img/bomb-icon.png' alt='bomb'>"
          ) {
            // GAME OVER: client placed a flag on a safe tile and exposed a mine!
            gameLost(parseInt(adjacentTile.dataset.value));
            return;
          }
        }
      }
      chordRadius.forEach((value) => {
        let adjacentTile = document.querySelector(
          `[data-value="${currTileVal + value}"]`
        );
        if (adjacentTile) {
          if (
            !gameState.visitedTilesValue.includes(
              parseInt(adjacentTile.dataset.value)
            ) &&
            !gameState.randomMines.includes(
              parseInt(adjacentTile.dataset.value)
            )
          ) {
            // Tile is able to chord/reveal surrounding tiles
            // console.log(`${currTileVal} able to chord -> ${parseInt(adjacentTile.dataset.value)}`);
            adjacentTile.style.backgroundColor = "#707070";
            // adjacentTile.style.backgroundColor = "green";
            gameState.visitedTilesValue.push(
              parseInt(adjacentTile.dataset.value)
            );
            // update the gameState
            updateVisitedTilesForOtherClient();
            // check if game is won (if all safe tiles have been visited)
            if (checkGameWon()) {
              gameWon();
            }
            scanMineRadius(adjacentTile);
            if (adjacentTile.innerHTML === "") {
              floodFill(adjacentTile);
            }
          }
        }
      });
    }
  }
};

const mouseUpHandler = (event) => {
  // when user releases left and right click
  if (event.button === 0) {
    leftClicked = false;
  } else if (event.button === 2) {
    rightClicked = false;
  }
};

const rightClickHandler = (event) => {
  event.preventDefault();
  // If game is over, ignore right click feature
  if (gameState.gameOver || spectate) {
    return;
  }
  let currTile = event.target;
  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      currTile.innerHTML = "<img src='../img/flag-icon.png' alt='flag'>";
      currTile.setAttribute("rightClicked", "true");
      gameState.buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML =
        gameState.buttonFlagCounter;
      // update the gamestate
      gameState.flaggedTilesValue.push(parseInt(currTile.dataset.value));
      clientFlags.push(parseInt(currTile.dataset.value));
    } else {
      if (currTile.style.backgroundColor === "#830000") {
        // check if the tile has an exposed mine (caused by other client)
        currTile.innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
      } else {
        currTile.innerHTML = "";
      }
      currTile.setAttribute("rightClicked", "false");
      gameState.buttonFlagCounter += 1;
      document.querySelector(".flagCounter").innerHTML =
        gameState.buttonFlagCounter;
      if (clientFlags.includes(parseInt(currTile.dataset.value))) {
        clientFlags.splice(
          clientFlags.indexOf(parseInt(currTile.dataset.value)),
          1
        );
      } else {
        // player removed other player's flag
        // console.log(`remove flag ${currTile.dataset.value} for other player`);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              method: "removeFlagForOtherClient",
              flagValueToRemove: parseInt(currTile.dataset.value),
              buttonFlagCounter: gameState.buttonFlagCounter,
              serverId: serverId,
              clientId: clientId,
            })
          );
        }
      }
      gameState.flaggedTilesValue.splice(
        gameState.flaggedTilesValue.indexOf(parseInt(currTile.dataset.value)),
        1
      );
    }
    updateFlagsToServer();
    sendGameStateToServer(); // update the gamestate
  }
};

function paintContainerGrids() {
  const sidebar = document.querySelector("#sidebar");
  const gameBoard = document.querySelector("#gameBoard");
  const chatBoxHeader = document.querySelector(".header");
  const chatButton = document.querySelector(".chatButton");
  gameBoard.onselectstart = function () {
    // prevent gameBoard contents from being highlighted
    return false;
  };
  const bgCol = getComputedStyle(document.body).backgroundColor;
  // bgCol = "rgb(r,g,b)"
  const r = bgCol.split(",")[0].split("(")[1];
  const g = bgCol.split(",")[1];
  const b = bgCol.split(",")[2].split(")")[0];
  sidebar.style.backgroundColor =
    "rgb(" +
    (parseInt(r) - 60) +
    "," +
    (parseInt(g) - 60) +
    "," +
    (parseInt(b) - 60) +
    ")";
  gameBoard.style.backgroundColor =
    "rgb(" +
    (parseInt(r) - 15) +
    "," +
    (parseInt(g) - 15) +
    "," +
    (parseInt(b) - 15) +
    ")";
  chatBoxHeader.style.backgroundColor = gameBoard.style.backgroundColor;
  chatButton.style.backgroundColor = gameBoard.style.backgroundColor;
  document.body.style.backgroundImage = `radial-gradient(${
    getComputedStyle(gameBoard).backgroundColor
  } 20%, ${getComputedStyle(sidebar).backgroundColor})`;
}

function generateBg() {
  let r = Math.floor(Math.random() * 200);
  let g = Math.floor(Math.random() * (200 - 120) + 120); // random # b/w [120-200)
  let b = Math.floor(Math.random() * (200 - 120) + 120);
  document.body.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
  console.log("backgroundColor: " + "rgb(" + r + "," + g + "," + b + ")");
  paintContainerGrids();
}

// Changing selected difficulty
const selectDifficulty = document.querySelector("#choice");
selectDifficulty.addEventListener("change", () => {
  playAgain();
});

function createFlagButton() {
  const gameBoard = document.querySelector("#gameBoard");
  const fButton = document.createElement("button");
  const fCounter = document.createElement("span");
  const fCounterValue = document.createTextNode(gameState.numMines);
  fCounter.appendChild(fCounterValue);
  fButton.appendChild(fCounter);
  gameBoard.append(fButton);
  fButton.classList.add("flagButton");
  fCounter.classList.add("flagCounter");
  fButton.addEventListener("click", flagButtonClick);
  fButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  fButton.setAttribute("flagButtonClicked", false);
}

function flagButtonClick() {
  // If game is over, ignore flag button feature
  if (gameState.gameOver || spectate) {
    return;
  }
  const flagButton = this;
  const tdElements = document.querySelectorAll("#gameWindow td");
  if (flagButton.getAttribute("flagButtonClicked") === "false") {
    // console.log(`[FLAG BUTTON CLICKED]`);
    flagButton.setAttribute("flagButtonClicked", true);
    flagButton.style.backgroundColor = "#707070";
    tdElements.forEach((td) => {
      if (!gameState.visitedTilesValue.includes(td.dataset.value)) {
        td.removeEventListener("click", leftClick);
        td.addEventListener("click", setFlagHandler);
      }
    });
  } else {
    flagButton.setAttribute("flagButtonClicked", false);
    flagButton.style.backgroundColor = "lightgray";
    tdElements.forEach((td) => {
      if (!gameState.visitedTilesValue.includes(td.dataset.value)) {
        td.removeEventListener("click", setFlagHandler);
        td.addEventListener("click", leftClick);
      }
    });
  }
}

// setFlagHandler() should work in tandem with rightClickHandler()
function setFlagHandler() {
  if (gameState.gameOver || spectate) {
    return;
  }
  let currTile = this;
  if (!gameState.visitedTilesValue.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      currTile.innerHTML = "<img src='../img/flag-icon.png' alt='flag'>";
      currTile.setAttribute("rightClicked", "true");
      gameState.buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML =
        gameState.buttonFlagCounter;
      // update the gamestate
      gameState.flaggedTilesValue.push(parseInt(currTile.dataset.value));
      clientFlags.push(parseInt(currTile.dataset.value));
    } else {
      if (currTile.style.backgroundColor === "#830000") {
        // check if the tile has an exposed mine (caused by other client)
        currTile.innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
      } else {
        currTile.innerHTML = "";
      }
      currTile.setAttribute("rightClicked", "false");
      gameState.buttonFlagCounter += 1;
      document.querySelector(".flagCounter").innerHTML =
        gameState.buttonFlagCounter;
      if (clientFlags.includes(parseInt(currTile.dataset.value))) {
        clientFlags.splice(
          clientFlags.indexOf(parseInt(currTile.dataset.value)),
          1
        );
      } else {
        // player removed other player's flag
        // console.log(`remove flag ${currTile.dataset.value} for other player`);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              method: "removeFlagForOtherClient",
              flagValueToRemove: parseInt(currTile.dataset.value),
              buttonFlagCounter: gameState.buttonFlagCounter,
              serverId: serverId,
              clientId: clientId,
            })
          );
        }
      }
      gameState.flaggedTilesValue.splice(
        gameState.flaggedTilesValue.indexOf(parseInt(currTile.dataset.value)),
        1
      );
    }
    updateFlagsToServer();
    // sendGameStateToServer(); // update the gamestate
  }
}

function createBuddy() {
  const bButton = document.createElement("button");
  bButton.innerHTML =
    "<img class='buddyImg' src='../img/smile-icon.png' alt='buddy-smile'>";
  bButton.classList.add("buddyButton");
  bButton.addEventListener("click", buddyButtonClick);
  bButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  const gameBoard = document.querySelector("#gameBoard");
  gameBoard.insertBefore(bButton, gameBoard.querySelector("#gameWindow"));
}

function buddyButtonClick() {
  if (gameState.gameOver) {
    playAgain();
  }
}

function createPlayAgainButton() {
  const playAgainButton = document.createElement("button");
  const textSpan = document.createElement("span");
  const playAgainText = document.createTextNode("Play Again");
  textSpan.appendChild(playAgainText);
  playAgainButton.appendChild(textSpan);
  const gameBoard = document.querySelector("#gameBoard");
  gameBoard.append(playAgainButton);
  playAgainButton.classList.add("playAgainButton");
  playAgainButton.addEventListener("click", playAgain);
  playAgainButton.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
}

function gameLost(tileValue) {
  console.log(`[GAME OVER]`);
  spectate = true;
  document.querySelector(".buddyButton").innerHTML =
    "<img class='buddyImg' src='../img/dizzy-icon.png' alt='buddy-dizzy'>";
  let tiles = document.querySelectorAll("#gameWindow td");

  gameState.playersSpectating += 1;
  // console.log(`gameState.playersSpectating: ${gameState.playersSpectating}`);
  sendGameStateToServer();

  if (gameState.multiplayer && gameState.playersSpectating === 1) {
    // if other client still able to play, relay the single mine to them
    tiles[tileValue].innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
    tiles[tileValue].style.backgroundColor = "#830000";
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          method: "foundMine",
          mineValue: tileValue,
          serverId: serverId,
          clientId: clientId,
        })
      );
    }
  } else {
    gameState.gameOver = true;
    gameState.randomMines.forEach((td) => {
      tiles[td].innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
      tiles[td].style.backgroundColor = "#830000";
      if (tiles[td].getAttribute("rightClicked") === "true") {
        clientFlags.includes(parseInt(tiles[td].dataset.value))
          ? (tiles[td].innerHTML +=
              "<img class='flagOnMine' src='../img/flag-icon.png' alt='flag'>")
          : (tiles[td].innerHTML +=
              "<img class='flagOnMine' src='../img/blueflag-icon.png' alt='flag'>");
      }
    });
    createPlayAgainButton();
    sendGameStateToServer();
  }
  tiles.forEach((td) => {
    td.removeEventListener("click", leftClick);
  });
}

function checkGameWon() {
  return document.getElementsByClassName("tile").length -
    gameState.visitedTilesValue.length ===
    gameState.numMines
    ? true
    : false;
}

function gameWon() {
  gameState.gameOver = true;
  console.log(`[GAME WON]`);
  wins += 1;
  document.querySelector("#clientUsername .wins").innerText = wins;
  document.querySelector(".buddyButton").innerHTML =
    "<img class='buddyImg' src='../img/chill-icon.png' alt='buddy-chill'>";
  let tdElements = document.querySelectorAll("#gameWindow td");
  tdElements.forEach((td) => {
    td.removeEventListener("click", leftClick);
  });
  createPlayAgainButton();
  sendGameStateToServer();
  sendClientWinsToServer();
  // handle gameWon() for other client
  if (gameState.multiplayer) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          method: "handleGameWon",
          gameState: gameState,
          serverId: serverId,
          clientId: clientId,
        })
      );
    }
  }
}

function playAgain() {
  console.clear();
  spectate = false;
  gameState.playersSpectating = 0;
  gameState.gameOver = false;
  gameState.numMines = 0;
  gameState.randomMines = [];
  gameState.visitedTilesValue = [];
  gameState.flaggedTilesValue = [];
  clientFlags = [];
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  document.querySelector(".buddyButton").remove();
  document.querySelector(".flagButton").remove();
  clearGameState();
  if (selectDifficulty.value === "easy") {
    // generateEasy(true);
    generateEasy();
  } else if (selectDifficulty.value === "medium") {
    generateMedium();
  } else {
    generateHard();
  }
  generateGameForOtherClient();
}

function sendGameStateToServer() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "updateGameState",
        gameState: gameState,
        serverId: serverId,
        clientId: clientId,
      })
    );
  }
}

function sendClientWinsToServer() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "updateClientWins",
        serverId: serverId,
        clientId: clientId,
        wins: wins,
      })
    );
  }
}

function generateGameForOtherClient() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "generateGameForOtherClient",
        gameState: gameState,
        serverId: serverId,
        clientId: clientId,
      })
    );
  }
}

function clearGameState() {
  // whenever a client plays new game or changes difficulty
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "clearGameState",
        serverId: serverId,
      })
    );
  }
}

function updateVisitedTilesForOtherClient() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "updateVisitedTilesForOtherClient",
        gameState: gameState,
        serverId: serverId,
        clientId: clientId,
      })
    );
  }
}

function updateFlagsToServer() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        method: "updateFlags",
        clientFlags: clientFlags,
        serverFlags: gameState.flaggedTilesValue,
        buttonFlagCounter: gameState.buttonFlagCounter,
        serverId: serverId,
        clientId: clientId,
      })
    );
  }
}

function updateJoiningClientBoard() {
  // console.log(`Updating board for the joining client: ${clientUsername}`);
  console.log(gameState);
  let tiles = document.querySelectorAll("#gameWindow td");
  // if initialClick() was already executed by other client, remove it for the joining client
  if (gameState.visitedTilesValue.length > 0) {
    tiles.forEach((t) => {
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
    gameState.flaggedTilesValue.forEach((flagValue) => {
      tiles[flagValue].innerHTML =
        "<img src='../img/blueflag-icon.png' alt='blueflag'>";
      tiles[flagValue].setAttribute("rightClicked", true);
    });
  }
}

function updateClientBoard(data) {
  // console.log(`updateClientBoard(${data.method}) for ${clientUsername}`);
  randomMines = gameState.randomMines;
  let tiles = document.querySelectorAll("#gameWindow td");
  let flagCounter = document.querySelector(".flagCounter");

  switch (data.method) {
    case "updateFlagsForOtherClient": // whenever a client adds or removes their own flag
      gameState.flaggedTilesValue = data.serverFlags;
      gameState.buttonFlagCounter = data.buttonFlagCounter;
      flagCounter.innerHTML = data.buttonFlagCounter;
      tiles.forEach((td) => {
        if (
          gameState.visitedTilesValue.includes(parseInt(td.dataset.value)) ||
          clientFlags.includes(parseInt(td.dataset.value))
        ) {
          return;
        }
        if (data.otherClientFlags.includes(parseInt(td.dataset.value))) {
          td.innerHTML = "<img src='../img/blueflag-icon.png' alt='blueflag'>";
          td.setAttribute("rightClicked", true);
        } else {
          td.setAttribute("rightClicked", false);
          if (td.style.backgroundColor === "#830000") {
            td.innerHTML = "<img src='../img/bomb-icon.png' alt='bomb'>";
          } else {
            td.innerHTML = "";
          }
        }
      });
      break;
    case "removedFlagForOtherClient": // whenever a client removes other client's flag
      // console.log(`remove flag ${data.flagValueToRemove} for ${clientUsername}`);
      clientFlags = data.clientFlags;
      tiles = document.querySelectorAll("#gameWindow td");
      tiles[data.flagValueToRemove].setAttribute("rightClicked", false);
      tiles[data.flagValueToRemove].innerHTML = "";
      flagCounter = document.querySelector(".flagCounter");
      flagCounter.innerHTML = data.buttonFlagCounter;
      break;
    case "removedFlagsForOtherClient": // whenever other client's flags are removed by initialClick() or floodFill()
      // console.log(`remove flags ${data.flagValuesToRemove} for ${clientUsername}`);
      clientFlags = data.clientFlags;
      tiles = document.querySelectorAll("#gameWindow td");
      data.flagValuesToRemove.forEach((flagValue) => {
        tiles[flagValue].setAttribute("rightClicked", false);
        tiles[flagValue].innerHTML = "";
      });
      flagCounter = document.querySelector(".flagCounter");
      flagCounter.innerHTML = data.buttonFlagCounter;
      break;
    case "updateGameState_InitialClick":
      // console.log(`update board w/ ${data.method} for ${clientUsername}`);
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
      tiles = document.querySelectorAll("#gameWindow td");
      gameState.visitedTilesValue.forEach((tileValue) => {
        tiles[tileValue].innerHTML = "";
        tiles[tileValue].style.backgroundColor = "#707070";
        tiles[tileValue].removeEventListener("click", initialClick);
        tiles[tileValue].removeEventListener("click", rightClickHandler);
        scanMineRadius(tiles[tileValue]);
      });
      tiles.forEach((td) => {
        if (!gameState.visitedTilesValue.includes(parseInt(td.dataset.value))) {
          td.removeEventListener("click", initialClick);
          td.addEventListener("click", leftClick);
        }
      });
      break;
    case "updateVisitedTilesForOtherClient":
      // console.log(`update visited tiles w/ ${data.method} for ${clientUsername}`);
      gameState.visitedTilesValue = data.visitedTilesValue;
      data.visitedTilesValue.forEach((tileValue) => {
        tiles[tileValue].innerHTML = "";
        tiles[tileValue].style.backgroundColor = "#707070";
        tiles[tileValue].removeEventListener("click", initialClick);
        tiles[tileValue].removeEventListener("click", rightClickHandler);
        scanMineRadius(tiles[tileValue]);
      });
      break;
    case "updateClientWins":
      document.querySelector(
        ".leaderboard-player:not(#clientUsername) .wins"
      ).innerText = data.wins;
      break;
  }
}

// update the chat box
function updateChat(data) {
  switch (data.status) {
    case "clearChatMessages":
      // Clears client's chat messages when they join another server
      while (chatBoxMessages.firstChild) {
        chatBoxMessages.removeChild(chatBoxMessages.firstChild);
      }
      chatMsgLi = document.createElement("li");
      chatMsgLi.classList.add("chatMessage", "status");
      chatMsgLi.innerHTML = `${data.player} <strong class=joined>joined</strong> server ${data.serverId}`;
      chatBoxMessages.appendChild(chatMsgLi);
      break;
    case "newClientJoined":
      chatMsgLi = document.createElement("li");
      chatMsgLi.classList.add("chatMessage", "status");
      chatMsgLi.innerHTML = `${data.player} <strong class=joined>joined</strong> server ${data.serverId}`;
      chatBoxMessages.appendChild(chatMsgLi);
      break;
    case "otherClientLeft":
      chatMsgLi = document.createElement("li");
      chatMsgLi.classList.add("chatMessage", "status");
      chatMsgLi.innerHTML = `${data.player} <strong class=left>left</strong> server ${data.serverId}`;
      chatBoxMessages.appendChild(chatMsgLi);
      break;
    case "otherClientMessage":
      // Updates client's chatGUI when another user chats
      chatMsgLi = document.createElement("li");
      chatMsgLi.classList.add("chatMessage", "otherClient");
      chatMsgLi.innerText = data.chatMessage;
      chatBoxMessages.appendChild(chatMsgLi);
      chatBox.scrollTop = chatBox.scrollHeight; // Scroll to most recent chat message
      break;
  }
  // Update chatNotifyIcon if chatGUI is closed/hidden
  if (chatGUI.style.display === "none") {
    chatNotifyCounter += 1;
    chatNotifyIcon.style.display = "flex";
    if (chatNotifyCounter < 100) {
      chatNotifyIcon.innerHTML = chatNotifyCounter;
    } else {
      chatNotifyIcon.innerHTML = "99+";
    }
  }
}

generateMedium(false);
