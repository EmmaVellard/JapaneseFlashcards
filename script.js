// DOM Elements
const kanjiDisplay = document.getElementById('kanji-display');
const answerDisplay = document.getElementById('answer-display');
const overlay = document.getElementById('overlay');
const showAnswerBtn = document.getElementById('show-answer');
const rightBtn = document.getElementById('right');
const wrongBtn = document.getElementById('wrong');
const reviewBtn = document.getElementById('review');
const wrongContainer = document.getElementById('wrong-cards');

const correctCountDisplay = document.getElementById('correct-count');
const wrongCountDisplay = document.getElementById('wrong-count');
const remainingCountDisplay = document.getElementById('remaining-count');
const successRateDisplay = document.getElementById('success-rate');

let currentIndex = 0;
let wrongList = [];
let correctCount = 0;
let wrongCount = 0;

// Shuffle function (Fisher–Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Show current kanji
function showKanji(index) {
  const kanji = kanjiList[index];
  kanjiDisplay.textContent = kanji.kanji;

  // Clear answer
  answerDisplay.innerHTML = '';
  overlay.classList.remove('hidden');

  showAnswerBtn.style.display = 'inline-block';
  rightBtn.style.display = 'none';
  wrongBtn.style.display = 'none';
}

// Update counters and success rate
function updateCounters() {
  correctCountDisplay.textContent = `Correct: ${correctCount}`;
  wrongCountDisplay.textContent = `Wrong: ${wrongCount}`;
  const remaining = kanjiList.length - (correctCount + wrongCount);
  remainingCountDisplay.textContent = `Remaining: ${remaining}`;
  const totalAnswered = correctCount + wrongCount;
  const success = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
  successRateDisplay.textContent = `Success: ${success}%`;
}

// Show answer
showAnswerBtn.addEventListener('click', () => {
  const kanji = kanjiList[currentIndex];
  answerDisplay.innerHTML = `
    <p>${kanji.meaning}</p>
    <p>${kanji.onyomi}</p>
    <p>${kanji.kunyomi}</p>
  `;
  overlay.classList.add('hidden');
  showAnswerBtn.style.display = 'none';
  rightBtn.style.display = 'inline-block';
  wrongBtn.style.display = 'inline-block';
});

// Handle correct
rightBtn.addEventListener('click', () => {
  correctCount++;
  nextKanji();
});

// Handle wrong
wrongBtn.addEventListener('click', () => {
  wrongList.push(kanjiList[currentIndex]);
  wrongCount++;
  nextKanji();
});

// Move to next kanji
function nextKanji() {
  currentIndex = (currentIndex + 1) % kanjiList.length;
  showKanji(currentIndex);
  updateCounters();
}

// Review wrong kanji
reviewBtn.addEventListener('click', showWrongList);

function showWrongList() {
  wrongContainer.innerHTML = '';
  if (wrongList.length === 0) {
    wrongContainer.textContent = "No wrong kanji yet!";
    return;
  }

  wrongList.forEach((k) => {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.padding = '30px 20px'; // taller card with horizontal padding
    card.style.border = '2px solid #b387d7';
    card.style.borderRadius = '12px';  
    card.style.marginBottom = '15px'; // space between cards
    card.style.width = '100%'; // make it full width
    card.style.boxSizing = 'border-box';
    card.style.backgroundColor = '#fff';

    const kanjiDiv = document.createElement('div');
    kanjiDiv.textContent = k.kanji;
    kanjiDiv.style.fontSize = '4rem'; // bigger kanji
    kanjiDiv.style.flex = '1';
    kanjiDiv.style.textAlign = 'center';
    kanjiDiv.style.border = 'none'; // remove any side borders

    const detailsDiv = document.createElement('div');
    detailsDiv.innerHTML = `
      <p>${k.meaning}</p>
      <p>${k.onyomi}</p>
      <p>${k.kunyomi}</p>
    `;
    detailsDiv.style.flex = '2';
    detailsDiv.style.paddingLeft = '40px';
    detailsDiv.style.fontSize = '1.8rem'; // bigger text
    detailsDiv.style.border = 'none'; // remove any side borders

    card.appendChild(kanjiDiv);
    card.appendChild(detailsDiv);
    wrongContainer.appendChild(card);
  });
}

// Initialize
if (typeof kanjiList !== 'undefined' && kanjiList.length > 0) {
  shuffle(kanjiList);
  showKanji(currentIndex);
  updateCounters();
} else {
  kanjiDisplay.textContent = "No kanji data loaded!";
}