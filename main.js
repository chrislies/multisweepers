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
    console.log(Math.floor(Math.random() * (n+1)));
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
    console.log(Math.floor(Math.random() * (n+1)));
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
    console.log(Math.floor(Math.random() * (n+1)));
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