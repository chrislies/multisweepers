const gw = document.getElementById("game-window");

function generateEasy() {
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }
  let n = 9; // n x n grid
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.addEventListener("click", initialClick);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
}

function generateMedium() {
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }
  let n = 16; // n x n grid
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < n; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.addEventListener("click", initialClick);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
}

function generateHard() {
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  }
  let n = 16; // n x m grid
  let m = 30
  let tileCounter = 0;
  for (let i = 0; i < n; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < m; j++) {
      let data = document.createElement("td");
      data.classList.add("tile-" + tileCounter);
      data.dataset.value = tileCounter;
      data.addEventListener("click", initialClick);
      row.appendChild(data);
      tileCounter++;
    }
    gw.appendChild(row);
  }
}

function generateBg() {
  let r = Math.floor(Math.random() * 200);
  let g = Math.floor(Math.random() * 200);
  let b = Math.floor(Math.random() * 200);
  document.body.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
  console.log("backgroundColor: " + "rgb(" + r + "," + g + "," + b + ")");
}

const selectDifficulty = document.getElementById("choice");
selectDifficulty.addEventListener("change", () => {
  const difficulty = selectDifficulty.value;
  switch (difficulty) {
    case "easy":
      // console.log("Easy");
      generateEasy();
      generateBg();
      break;
    case "medium":
      // console.log("Medium");
      generateMedium();
      generateBg();
      break
    case "hard":
      // console.log("Hard");
      generateHard();
      generateBg();
      break;
    default:
      console.log("Select difficulty!");
  }
});

let visitedTiles = [];
let randomMines = [];
let possibleMove = [];
let mineRadiusNB = [];
let mineRadiusLB = [];
let mineRadiusRB = [];

function initialClick() { // clear x surrounding tiles upon inital click on one of the tiles
  let initialTile = this;
  let tableSize = document.querySelectorAll("td").length - 1; // get the last td element to determine tableSize
  console.log("tableSize = " + tableSize);
  let numRandomTiles = 0;
  possibleMove = [];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
  visitedTiles = [];
  randomMines = [];
  visitedTiles.push(initialTile);
  initialTile.style.backgroundColor = "#707070";
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
      mineRadiusRB = [-31, -30, 1, 29, 30];  // possible mine locations for each right border tile
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
    nextTile.style.backgroundColor = "#707070";
  }

  // convert the string dataset.value of each visitedTiles[] into int
  let valueVisitedTiles = visitedTiles.map(td => parseInt(td.dataset.value));
  // alternative version w/o map:
  // let valueVisitedTiles = []
  // visitedTiles.forEach(function(td){
  //   valueVisitedTiles.push(parseInt(td.dataset.value));
  // }); 

  // Generate mines
  let tile = document.getElementsByTagName("td");
  while (randomMines.length < numMines) {
    let randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    while (randomMines.includes(randomNum) || valueVisitedTiles.includes(randomNum)) {
      randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    }
    randomMines.push(randomNum);
    tile[randomNum].style.backgroundColor = "blue";
    // tile[randomNum].className += "-mine";
  }

  // for each visited tile: check its surrounding tiles for mines
  visitedTiles.forEach(td => {
    let mineCounter = 0;
    let mineRadius = [];
    let tileValue = parseInt(td.dataset.value);

    if (tileValue % gw.rows.length == 0) {
      // If current tile is on the left border, mineRadius becomes limited to mineRadiusLB
      mineRadius = mineRadiusLB;
    } else if (tileValue % gw.rows.length == gw.rows.length - 1) {
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
        td.innerHTML = mineCounter;
      }
    }
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

function leftClick() {
  let currTile = this;
  if (randomMines.includes(parseInt(currTile.dataset.value))) {
    console.log("[GAME OVER!]");
    let mines = document.querySelectorAll("td");
    randomMines.forEach(td => {
      mines[td].innerHTML = "X";
      mines[td].style.backgroundColor = "red";
    });
    gameOver();
    return;
  }
  console.log("[left click]");
  visitedTiles.push(currTile);
  currTile.style.backgroundColor = "#707070"; //gray=808080
  let mineCounter = 0;
  let mineRadius = [];
  let tileValue = parseInt(currTile.dataset.value);

  if (tileValue % gw.rows.length == 0) {
    // If current tile is on the left border, mineRadius becomes limited to mineRadiusLB
    mineRadius = mineRadiusLB;
  } else if (tileValue % gw.rows.length == gw.rows.length - 1) {
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
      currTile.innerHTML = mineCounter;
    }
  }
  currTile.removeEventListener("click", leftClick);
}

function gameOver() {
  let tdElements = document.querySelectorAll("td");
  tdElements.forEach(td => {
    td.removeEventListener("click", leftClick);
  });
}

generateEasy();