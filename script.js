// DOM Elements
const kanjiDisplay = document.getElementById('kanji-display');
const answerDisplay = document.getElementById('answer-display');
const overlay = document.getElementById('overlay');
const showAnswerBtn = document.getElementById('show-answer');
const rightBtn = document.getElementById('right');
const wrongBtn = document.getElementById('wrong');
const reviewBtn = document.getElementById('review');
const wrongContainer = document.getElementById('wrong-cards');
const choicesContainer = document.getElementById('choices');
const toggleModeBtn = document.getElementById('toggle-mode');

const correctCountDisplay = document.getElementById('correct-count');
const wrongCountDisplay = document.getElementById('wrong-count');
const remainingCountDisplay = document.getElementById('remaining-count');
const successRateDisplay = document.getElementById('success-rate');

// State
let currentIndex = 0;
let wrongList = [];
let correctCount = 0;
let wrongCount = 0;
let quizMode = false;

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

  if (quizMode) {
    hideElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
    showChoices(kanji);
  } else {
    hideElement(choicesContainer);
    showElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
  }
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

// Multiple-choice mode
function showChoices(correctKanji) {
  choicesContainer.innerHTML = '';

  const wrongAnswers = kanjiList
    .filter(k => k !== correctKanji)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  const allAnswers = [...wrongAnswers, correctKanji].sort(() => 0.5 - Math.random());

  allAnswers.forEach((choice, idx) => {
    const btn = document.createElement('button');
    // Add the number key label before the meaning
    btn.textContent = `${choice.meaning} (${idx + 1})`;

    btn.addEventListener('click', () => {
      const allBtns = choicesContainer.querySelectorAll('button');
      allBtns.forEach(b => b.disabled = true);

      allBtns.forEach(b => {
        const isCorrect = b.textContent.includes(correctKanji.meaning);
        b.style.backgroundColor = isCorrect ? '#66bb6a' : '#e57373';
        b.style.color = '#fff';
      });

      if (choice === correctKanji) {
        correctCount++;
      } else {
        wrongList.push(correctKanji);
        wrongCount++;
      }

      answerDisplay.innerHTML = `
        <p>${correctKanji.meaning}</p>
        <p>${correctKanji.onyomi}</p>
        <p>${correctKanji.kunyomi}</p>
      `;
      overlay.classList.add('hidden');

      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next (§)';
      nextBtn.classList.add('next-btn');
      nextBtn.addEventListener('click', () => {
        nextKanji();
      });
      choicesContainer.appendChild(nextBtn);
    });

    choicesContainer.appendChild(btn);
  });

  showElement(choicesContainer);
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

// Mode toggle
toggleModeBtn.addEventListener('click', () => {
  quizMode = !quizMode;
  toggleModeBtn.textContent = quizMode ? 'Switch to Flashcard Mode (T)' : 'Switch to Multiple Choice (T)';

  correctCount = 0;
  wrongCount = 0;
  wrongList = [];
  currentIndex = 0;

  shuffle(kanjiList);
  updateCounters();
  showKanji(currentIndex);
});

// Keyboard Shortcuts
document.addEventListener('keydown', e => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();

  if (!quizMode) {
    // Flashcard mode
    if (key === 's' && !showAnswerBtn.classList.contains('hidden')) showAnswerBtn.click();
    if (key === 'c' && !rightBtn.classList.contains('hidden')) rightBtn.click();
    if (key === 'w' && !wrongBtn.classList.contains('hidden')) wrongBtn.click();
  } else {
    // Multiple-choice mode
    if (['1','2','3','4'].includes(key)) {
      const index = parseInt(key) - 1;
      const choiceButtons = choicesContainer.querySelectorAll('button:not(.next-btn)');
      if (choiceButtons[index] && !choiceButtons[index].disabled) {
        choiceButtons[index].click();
      }
    }
    if (key === '§') {
      const nextBtn = choicesContainer.querySelector('.next-btn');
      if (nextBtn) nextBtn.click();
    }
  }

  // Works in both modes
  if (key === 't') toggleModeBtn.click(); 
  if (key === 'r') reviewBtn.click();
});


// Init
if (Array.isArray(kanjiList) && kanjiList.length > 0) {
  shuffle(kanjiList);
  showKanji(currentIndex);
  updateCounters();
} else {
  kanjiDisplay.textContent = 'No kanji data loaded!';
  kanjiDisplay.classList.add('status-message');
}
