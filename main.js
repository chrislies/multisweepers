function generateMedium() {
  let gw = document.getElementById("game-window");
  console.log(gw.rows.length);
  if (gw.rows.length>0) {
    for (let i = gw.rows.legnth; i > 0; i--) {
      gw.rows[i].remove();
    }
  } else { 
    let n = 7; // n x n grid
    for (let i=0; i<n; i++) {
      let row = document.createElement("tr");
      for (let j=0; j<n; j++) {
        let data = document.createElement("td");
        row.appendChild(data);
      }
      gw.appendChild(row);
    }
  }
}

const selectDifficulty = document.getElementById("choice");
selectDifficulty.addEventListener("change", () => {
  const selectedValue = selectDifficulty.value;
  switch(selectedValue) {
    case "easy":
      console.log("Easy");
      // generateEasy();
      break;
    case "medium":
      console.log("Medium");
      generateMedium();
      break
    case "hard":
      console.log("Hard");
      break;
    default:
      console.log("Select difficulty!")
  }
});

generateMedium();