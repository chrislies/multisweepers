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
  // generate bombs
  // let cell = document.getElementsByTagName("td");
  // let numBombs = 40; // # of bombs
  // let radnomBombs = [];
  // while (radnomBombs.length < numBombs) {
  //   let randomNum = Math.floor(Math.random() * (n * n - 1) + 1);
  //   if (!radnomBombs.includes(randomNum)) {
  //     radnomBombs.push(randomNum);
  //     cell[randomNum].style.backgroundColor = "red";
  //   }
  // }
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
  // generate bombs
  // let cell = document.getElementsByTagName("td");
  // let numBombs = 99; // # of bombs
  // let radnomBombs = [];
  // while (radnomBombs.length < numBombs) {
  //   let randomNum = Math.floor(Math.random() * (n * m - 1) + 1);
  //   if (!radnomBombs.includes(randomNum)) {
  //     radnomBombs.push(randomNum);
  //     cell[randomNum].style.backgroundColor = "red";
  //   }
  // }
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

function initialClick() { // clear x surrounding tiles upon inital click on one of the tiles
  let initialTile = this;
  let tableSize = document.querySelectorAll("td").length - 1; // get the last td element to determine tableSize
  console.log("tableSize = " + tableSize);
  let tdElements = document.querySelectorAll("td");
  let numRandomTiles = 0;
  let visitedTiles = [];
  let possibleMove = [];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
  visitedTiles.push(initialTile);
  initialTile.style.backgroundColor = "#707070";
  // console.log(parseInt(initialTile.dataset.value) + possibleMove[0]); // parseInt() converts string to int

  let difficulty = selectDifficulty.value;  // Check selected difficulty
  switch (difficulty) {
    case "easy":
      numMines = 10;
      possibleMove = [9, 1, -9, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      numRandomTiles = Math.round(Math.random() * (25 - 8) + 8);  // generate random # between [8-25)
      console.log("[initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "medium":
      numMines = 40;
      possibleMove = [16, 1, -16, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
      numRandomTiles = Math.round(Math.random() * (34 - 17) + 17);  // generate random # between [17-34)
      console.log("[initial click] Number of random tiles: " + numRandomTiles);
      break;
    case "hard":
      numMines = 99;
      possibleMove = [30, 1, -30, -1];  // can either move [up,right,down,left] by adding possibleMove[x] current tile
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
  let randomMines = [];
  while (randomMines.length < numMines) {
    let randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    while (randomMines.includes(randomNum) || valueVisitedTiles.includes(randomNum)) {
      randomNum = Math.round(Math.random() * tableSize); // generate random # between [0-tableSize)
    }
    randomMines.push(randomNum);
    tile[randomNum].style.backgroundColor = "red";
    tile[randomNum].className += "-mine";
  }

  // clear/empty visitedTiles[] and randomMines[]
  visitedTiles.length = 0;
  randomMines.length = 0;

  // after doing initial click, for each td element:
  // remove "initialClick" event listener 
  // add "leftClick" event listener
  tdElements.forEach(function (td) {
    td.removeEventListener("click", initialClick);
    td.addEventListener("click", leftClick);
  });
}

function leftClick() {
  console.log("[left click]");
  this.style.backgroundColor = "#707070"; //gray=808080
  // let cell = event.target;
  // cell.style.backgroundColor = "blue";
}

generateEasy();
