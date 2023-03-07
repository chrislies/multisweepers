const selectDifficulty = document.getElementById("choice");

selectDifficulty.addEventListener("change", () => {
  const selectedValue = selectDifficulty.value;
  switch(selectedValue) {
    case "easy":
      console.log("Easy");
      break;
    case "medium":
      console.log("Medium");
      break
    case "hard":
      console.log("Hard");
      break;
    default:
      console.log("Select difficulty!")
  }

});

