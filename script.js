let currentIndex = 0;
let wrongList = [];

// DOM Elements
const card = document.getElementById('flashcard');
const front = card.querySelector('.card-front');
const back = card.querySelector('.card-back');
const rightBtn = document.getElementById('right');
const wrongBtn = document.getElementById('wrong');
const reviewBtn = document.getElementById('review');
const wrongContainer = document.getElementById('wrong-cards');

// Shuffle function (Fisher–Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Show current card
function showCard(index) {
  const kanji = kanjiList[index];
  front.textContent = kanji.kanji;
  back.textContent = `${kanji.meaning} / ${kanji.reading}`;
  card.classList.remove('flipped');
}

// Flip card
card.addEventListener('click', () => card.classList.toggle('flipped'));

// Handle correct
rightBtn.addEventListener('click', () => nextCard());

// Handle wrong
wrongBtn.addEventListener('click', () => {
  wrongList.push(kanjiList[currentIndex]);
  nextCard();
});

// Next card
function nextCard() {
  currentIndex = (currentIndex + 1) % kanjiList.length;
  showCard(currentIndex);
}

// Review wrong kanji
reviewBtn.addEventListener('click', showWrongList);

function showWrongList() {
  wrongContainer.innerHTML = '';
  if (wrongList.length === 0) {
    wrongContainer.textContent = "No wrong kanji yet!";
    return;
  }
  wrongList.forEach(k => {
    const div = document.createElement('div');
    div.textContent = `${k.kanji} - ${k.meaning} / ${k.reading}`;
    wrongContainer.appendChild(div);
  });
}

// Initialize
shuffle(kanjiList); // Shuffle the kanji at start
showCard(currentIndex);