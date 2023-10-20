

function generateName() {
  const adjectives = ["Joyful","Grateful","Exciting","Friendly","Cheerful","Delightful","Hungry","Wonderful","Fantastic","Amazing","Enthusiastic","Trusting","Courageous","Optimistic","Talented","Humorous","Hopeful","Charismatic","Genuine","Creative","Confident","Radiant","Splendid","Harmonious","Intelligent","Dynamic","Vibrant","Brilliant","Excited","Jubilant","Awesome","Happy","Strong","Brave","Witty","Charming","Eager","Caring","Lucky","Jovial","Honest","Polite","Fearless","Sincere","Ecstatic","Zealous","Earnest","Relaxed","Mindful","Energetic"]
  const animals = ["Serpent","Hippo","Giraffe","Bunny","Turtle","Tortoise","Rabbit","Mouse","Cat","Tiger","Puppy","Lion","Elephant","Dolphin","Koala","Cheetah","Panda","Gorilla","Penguin","Flamingo","Zebra","Lemur","Sloth","Ostrich","Raccoon","Meerkat","Peacock","Hyena","Monkey","Capybara"]
  let name = "";
  name += adjectives[Math.floor(Math.random() * adjectives.length)] + " " + animals[Math.floor(Math.random() * animals.length)];
  return name;
}

for (let i = 0; i < 10; i++) {
  console.log(generateName());
}