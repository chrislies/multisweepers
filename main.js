const gw = document.getElementById("game-window");

function generateEasy() {
  // console.log(gw.rows.length);
  if (gw.rows.length > 0) {
    while (gw.rows.length > 0) {
      gw.deleteRow(0);
    }
  } 
  let n = 9; // n x n grid
  for (let i=0; i<n; i++) {
    let row = document.createElement("tr");
    for (let j=0; j<n; j++) {
      let data = document.createElement("td");
      data.addEventListener("click", leftClick);
      row.appendChild(data);
    }
    gw.appendChild(row);
  }
  // generate bombs
  let cell = document.getElementsByTagName("td");
  let numBombs = 10; // # of bombs
  let radnomBombs = [];
  while (radnomBombs.length < numBombs) {
    let randomNum = Math.floor(Math.random() * (n*n-1)+1);
    if (!radnomBombs.includes(randomNum)){
      radnomBombs.push(randomNum);
      cell[randomNum].style.backgroundColor = "red";
    } 
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
  for (let i=0; i<n; i++) {
    let row = document.createElement("tr");
    for (let j=0; j<n; j++) {
      let data = document.createElement("td");
      data.addEventListener("click", leftClick);
      row.appendChild(data);
    }
    gw.appendChild(row);
  }
  // generate bombs
  let cell = document.getElementsByTagName("td");
  let numBombs = 40; // # of bombs
  let radnomBombs = [];
  while (radnomBombs.length < numBombs) {
    let randomNum = Math.floor(Math.random() * (n*n-1)+1);
    if (!radnomBombs.includes(randomNum)){
      radnomBombs.push(randomNum);
      cell[randomNum].style.backgroundColor = "red";
    } 
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
  for (let i=0; i<n; i++) {
    let row = document.createElement("tr");
    for (let j=0; j<m; j++) {
      let data = document.createElement("td");
      data.addEventListener("click", leftClick);
      row.appendChild(data);
    }
    gw.appendChild(row);
  }
  // generate bombs
  let cell = document.getElementsByTagName("td");
  let numBombs = 99; // # of bombs
  let radnomBombs = [];
  while (radnomBombs.length < numBombs) {
    let randomNum = Math.floor(Math.random() * (n*m-1)+1);
    if (!radnomBombs.includes(randomNum)){
      radnomBombs.push(randomNum);
      cell[randomNum].style.backgroundColor = "red";
    } 
  }
}

const selectDifficulty = document.getElementById("choice");
selectDifficulty.addEventListener("change", () => {
  const selectedValue = selectDifficulty.value;
  switch(selectedValue) {
    case "easy":
      // console.log("Easy");
      generateEasy();
      break;
    case "medium":
      // console.log("Medium");
      generateMedium();
      break
    case "hard":
      // console.log("Hard");
      generateHard();
      break;
    default:
      console.log("Select difficulty!")
  }
});

function leftClick() {
  console.log("left click");
  this.style.backgroundColor = "red";
  // let cell = event.target;
  // cell.style.backgroundColor = "blue";
}

generateEasy();