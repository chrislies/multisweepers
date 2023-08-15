let socket = new WebSocket("ws://localhost:8080");
socket.onmessage = onMessage;

let clientId, gameId;
const playerCountTag = document.querySelector(".playerCount");

function onMessage(msg) {
  const data = JSON.parse(msg.data);
  console.log("Parsed data:", data);
  switch (data.tag) {
    case "connected":
      clientId = data.clientId;
      console.log("Received connected message, clientId:", data.clientId);
      break;
    case "gameGenerated":
      gameId = data.gameId;
      console.log("Received connected message, gameId:", data.gameId);
      // initGame();
      break;
    case "playerCount":
      playerCountTag.innerText = data.count;
      break;
  }
}

socket.onclose = function(event) {

}

const gameServers = [];
const joinServerButton = document.querySelector("#joinServerButton");

const gw = document.querySelector("#gameWindow");
let gameOver = false;
let numMines = 0;
let buttonFlagCounter = 0;
let visitedTiles = [];

let randomMines = [];
let possibleMove = [];
let mineRadiusNB = [];
let mineRadiusLB = [];
let mineRadiusRB = [];

function generateEasy() {
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
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
      data.setAttribute("rightClicked", false);
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
}

function generateMedium() {
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
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
      data.setAttribute("rightClicked", false);
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
}

function generateHard() {
  visitedTiles = [];
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
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
      data.setAttribute("rightClicked", false);
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
  visitedTiles.push(initialTile);
  let tableSize = document.querySelectorAll("td").length - 1; // get the last td element to determine tableSize
  console.log("tableSize = " + tableSize);
  let numRandomTiles = 0;
  // console.log(parseInt(initialTile.dataset.value) + possibleMove[0]); // parseInt() converts string to int

  let difficulty = selectDifficulty.value;  // Check selected difficulty
  switch (difficulty) {
    case "easy":
      numMines = 10;
      possibleMove = [9, 1, -9, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-10, -9, -8, -1, 1, 8, 9, 10];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-9, -8, 1, 9, 10];  // possible mine locations for each left border tile
      mineRadiusRB = [-10, -9, -1, 8, 9];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (25 - 8) + 8);  // generate random # between [8-25)
      console.log("[initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "medium":
      numMines = 40;
      possibleMove = [16, 1, -16, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-17, -16, -15, -1, 1, 15, 16, 17];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-16, -15, 1, 16, 17];  // possible mine locations for each left border tile
      mineRadiusRB = [-17, -16, -1, 15, 16];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (34 - 17) + 17);  // generate random # between [17-34)
      console.log("[initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "hard":
      numMines = 99;
      possibleMove = [30, 1, -30, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      mineRadiusNB = [-31, -30, -29, -1, 1, 29, 30, 31];  // possible mine locations for each NON-BORDER tile
      mineRadiusLB = [-30, -29, 1, 30, 31];  // possible mine locations for each left border tile
      mineRadiusRB = [-31, -30, -1, 29, 30];  // possible mine locations for each right border tile
      numRandomTiles = Math.round(Math.random() * (48 - 31) + 31);  // generate random # between [31-48)
      console.log("[initial click] Number of random tiles: " + numRandomTiles);
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
  }

  // convert the string dataset.value of each visitedTiles[] into int
  let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  // alternative version w/o map:
  // let valueVisitedTiles = []
  // visitedTiles.forEach(function(td){
  //   valueVisitedTiles.push(parseInt(td.dataset.value));
  // }); 

  // Generate mines
  // let tile = document.getElementsByTagName("td");
  while (randomMines.length < numMines) {
    let randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    while (randomMines.includes(randomNum) || valueVisitedTiles.includes(randomNum)) {
      randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    }
    randomMines.push(randomNum);
    // tile[randomNum].style.backgroundColor = "red";
    // tile[randomNum].className += "-mine";
  }

  // for each visited tile: 
  // 1. check and remove flag, and then change the tile's background color 
  // 2. check its surrounding tiles for mines (scanMineRadius(tile))
  visitedTiles.forEach(td => {
    if (td.getAttribute("rightClicked") === "true") {
      td.setAttribute("rightClicked", false);
      td.innerHTML = "";  // clears the innerHTML of a td element to account for flag icon
      buttonFlagCounter += 1; // update the total flag counter by 'returning' the flag to the counter
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
    }
    scanMineRadius(td);
    if (td.innerHTML === "") {
      floodFill(td);
    }
    td.style.backgroundColor = "#707070";
  });

  // after doing initial click, for each td element:
  // remove "initialClick" event listener 
  // add "leftClick" event listener ONLY IF tile has not been visited
  let tdElements = document.querySelectorAll("td");
  tdElements.forEach(td => {
    td.removeEventListener("click", initialClick);
    if (!visitedTiles.includes(td)) {
      td.addEventListener("click", leftClick);
    }
  });
}

function scanMineRadius(tile) {
  let colLength = document.querySelector("tr").children.length; // the number of elements in a row
  let mineCounter = 0;
  let mineRadius = [];
  let tileValue = parseInt(tile.dataset.value);

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, mineRadius becomes limited to mineRadiusLB
    mineRadius = mineRadiusLB;
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, mineRadius becomes limited to mineRadiusRB
    mineRadius = mineRadiusRB;
  } else {
    // If current tile is not on either border, mineRadius does not need to be limited
    mineRadius = mineRadiusNB;
  }
  for (let i = 0; i < mineRadius.length; i++) {
    if (randomMines.includes(tileValue + mineRadius[i])) {
      mineCounter++;
    }
    if (mineCounter > 0) {
      tile.innerHTML = mineCounter;
    }
  }
}

function floodFill(tile) {
  let colLength = document.querySelector("tr").children.length; // the number of elements in a row
  let floodRadius = [];
  let tileValue = parseInt(tile.dataset.value);
  let td = document.querySelectorAll("td");
  let flagCounter = document.querySelector(".flagCounter");

  if (tileValue % colLength === 0) {
    // If current tile is on the left border, floodRadius becomes limited to mineRadiusLB
    floodRadius = mineRadiusLB;
  } else if (tileValue % colLength === colLength - 1) {
    // If current tile is on the right border, floodRadius becomes limited to mineRadiusRB
    floodRadius = mineRadiusRB;
  } else {
    // If current tile is not on either border, floodRadius does not need to be limited
    floodRadius = mineRadiusNB;
  }

  for (let i = 0; i < floodRadius.length; i++) {
    let nextTileValue = tileValue + floodRadius[i]
    if (td[nextTileValue]) {
      if (!visitedTiles.includes(td[nextTileValue])) {
        visitedTiles.push(td[nextTileValue]);
        td[nextTileValue].style.backgroundColor = "#707070";
        scanMineRadius(td[nextTileValue]);
        if (td[nextTileValue].innerHTML === "") {
          floodFill(td[nextTileValue]);
        }
      }
      if (td[nextTileValue].getAttribute("rightClicked") === "true") {
        td[nextTileValue].setAttribute("rightClicked", false);
        td[nextTileValue].innerHTML = "";
        buttonFlagCounter += 1;
        flagCounter.innerHTML = buttonFlagCounter;
        scanMineRadius(td[nextTileValue]);
        if (td[nextTileValue].innerHTML === "") {
          floodFill(td[nextTileValue]);
        }
      }
    }
  }
}

function leftClick() {
  let currTile = this;
  // return if currTile is right clicked (flagged); otherwise proceed
  if (currTile.getAttribute("rightClicked") === "true" || gameOver) { return; }
  if (randomMines.includes(parseInt(currTile.dataset.value))) {
    gameLost();
    return;
  }
  if (!visitedTiles.includes(currTile)) {
    visitedTiles.push(currTile);  // this prevents currTile from being pushed more than once (ex. if user clicks too fast)
  }
  // console.log(`[LEFT CLICK]` + " on tile " + currTile.dataset.value);
  document.querySelector(".buddyButton").innerHTML = "<img class='buddyImg' src='./img/smile-icon.png' alt='buddy-smile'>";
  currTile.style.backgroundColor = "#707070"; //gray=808080
  scanMineRadius(currTile);
  currTile.removeEventListener("click", leftClick);

  if (currTile.innerHTML === "") {
    floodFill(currTile);
  }

  if (document.querySelectorAll("td").length - visitedTiles.length === numMines) {
    gameWon();
  }
}

const rightClickHandler = (event) => {
  event.preventDefault();
  // If game is over, ignore right click feature 
  if (gameOver) { return; }
  let currTile = event.target;
  let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  if (!valueVisitedTiles.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      // console.log(`[RIGHT CLICK]` + " on tile " + currTile.dataset.value);
      currTile.innerHTML = "<img src='./img/flag-icon.png' alt='flag'>";
      // currTile.style.backgroundColor = "orange";
      currTile.setAttribute("rightClicked", true);
      buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
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
    }
  }
};


function initGame() {
  let gameId = generateGameId();
  while (gameServers.includes(gameId)) {
    gameId = generateGameId();
    if (gameServers.length === Math.pow(9, 4)) {  // 9^4 possible servers (6561)
      console.log("MAXIMUM SERVERS REACHED");
      return;
    }
  }
  gameServers.push(gameId);
  console.log(`Game ID: ${gameId}`);
  paintContainerGrids();
  generateEasy();

};

function paintContainerGrids() {
  const sidebar = document.querySelector("#sidebar");
  const gameBoard = document.querySelector("#gameBoard");
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

function playAgain() {
  console.clear();
  gameOver = false;
  numMines = 0;
  randomMines = [];
  visitedTiles = [];
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  document.querySelector(".buddyButton").remove();
  document.querySelector(".flagButton").remove();
  if (selectDifficulty.value === "easy") {
    generateEasy();
  } else if (selectDifficulty.value === "medium") {
    generateMedium();
  } else {
    generateHard();
  }
}

joinServerButton.addEventListener("click", (event) => {
  event.preventDefault();
  let serverCode = document.querySelector("#serverCodeInput").value.trim();
  if (gameServers.includes(serverCode)) {
    console.log("Server exists, joining");
  } else {
    console.log(`Server '${serverCode}' does not exist`);
  }
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
  let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  if (!valueVisitedTiles.includes(parseInt(currTile.dataset.value))) {
    if (currTile.getAttribute("rightClicked") === "false") {
      currTile.innerHTML = "<img src='./img/flag-icon.png' alt='flag'>";
      // currTile.style.backgroundColor = "orange";
      currTile.setAttribute("rightClicked", true);
      buttonFlagCounter -= 1;
      document.querySelector(".flagCounter").innerHTML = buttonFlagCounter;
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
    }
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
  const playAgainText = document.createTextNode("Play Again");
  playAgainButton.appendChild(playAgainText);
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
  if (document.querySelector(".playAgainButton")) {
    document.querySelector(".playAgainButton").remove();
  }
  document.querySelector(".buddyButton").remove();
  document.querySelector(".flagButton").remove();
  if (selectDifficulty.value === "easy") {
    generateEasy();
  } else if (selectDifficulty.value === "medium") {
    generateMedium();
  } else {
    generateHard();
  }
}

// function generateGameId() {
//   let id = "";
//   const data = "0123456789";
//   for (let i = 0; i < 4; i++) {
//     id += data.charAt(Math.floor(Math.random() * data.length));
//   }
//   const serverCode = document.querySelector("#serverCode");
//   serverCode.innerText = id;
//   return id;
// }

class Minesweeper {
  createGame() {

  };

  initialClick() {

  };
};