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

// State
let currentIndex = 0;
let wrongList = [];
let correctCount = 0;
let wrongCount = 0;

// Shuffle Array (Fisher–Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// UI Helpers
function showElement(el) {
  el.classList.remove('hidden');
}

function hideElement(el) {
  el.classList.add('hidden');
}

function showKanji(index) {
  const kanji = kanjiList[index];
  kanjiDisplay.textContent = kanji.kanji;
  answerDisplay.textContent = '';
  overlay.classList.remove('hidden');
  showElement(showAnswerBtn);
  hideElement(rightBtn);
  hideElement(wrongBtn);
}

function updateCounters() {
  correctCountDisplay.textContent = `Correct: ${correctCount}`;
  wrongCountDisplay.textContent = `Wrong: ${wrongCount}`;
  const remaining = kanjiList.length - (correctCount + wrongCount);
  remainingCountDisplay.textContent = `Remaining: ${remaining}`;
  const totalAnswered = correctCount + wrongCount;
  const success = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
  successRateDisplay.textContent = `Success: ${success}%`;
}

// Event Handlers
showAnswerBtn.addEventListener('click', () => {
  const { meaning, onyomi, kunyomi } = kanjiList[currentIndex];
  answerDisplay.innerHTML = `
    <p>${meaning}</p>
    <p>${onyomi}</p>
    <p>${kunyomi}</p>
  `;
  overlay.classList.add('hidden');
  hideElement(showAnswerBtn);
  showElement(rightBtn);
  showElement(wrongBtn);
});

rightBtn.addEventListener('click', () => {
  correctCount++;
  nextKanji();
});

wrongBtn.addEventListener('click', () => {
  wrongList.push(kanjiList[currentIndex]);
  wrongCount++;
  nextKanji();
});

function nextKanji() {
  currentIndex = (currentIndex + 1) % kanjiList.length;
  showKanji(currentIndex);
  updateCounters();
}

reviewBtn.addEventListener('click', showWrongList);

function showWrongList() {
  wrongContainer.innerHTML = '';
  if (wrongList.length === 0) {
    wrongContainer.textContent = "No wrong kanji yet!";
    return;
  }
  wrongList.forEach(k => {
    const card = document.createElement('div');
    card.className = 'wrong-card';

    const kanjiDiv = document.createElement('div');
    kanjiDiv.className = 'wrong-kanji';
    kanjiDiv.textContent = k.kanji;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'wrong-details';
    detailsDiv.innerHTML = `
      <p>${k.meaning}</p>
      <p>${k.onyomi}</p>
      <p>${k.kunyomi}</p>
    `;

    card.append(kanjiDiv, detailsDiv);
    wrongContainer.appendChild(card);
  });
}

// Keyboard Shortcuts
document.addEventListener('keydown', e => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key.toLowerCase()) {
    case 's': if (!showAnswerBtn.classList.contains('hidden')) showAnswerBtn.click(); break;
    case 'c': if (!rightBtn.classList.contains('hidden')) rightBtn.click(); break;
    case 'w': if (!wrongBtn.classList.contains('hidden')) wrongBtn.click(); break;
    case 'r': reviewBtn.click(); break;
  }
});

// Init
if (Array.isArray(kanjiList) && kanjiList.length > 0) {
  shuffle(kanjiList);
  showKanji(currentIndex);
  updateCounters();
} else {
  kanjiDisplay.textContent = 'No kanji data loaded!';
}
