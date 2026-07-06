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
const levelSelect = document.getElementById('level-select');
const studyTypeSelect = document.getElementById('study-type-select');
const wrongTitle = document.getElementById('wrong-title');

const correctCountDisplay = document.getElementById('correct-count');
const wrongCountDisplay = document.getElementById('wrong-count');
const remainingCountDisplay = document.getElementById('remaining-count');
const successRateDisplay = document.getElementById('success-rate');

function mergeUniqueCards(...lists) {
  const seen = new Set();
  return lists.flat().filter(item => {
    const key = item.kanji || item.word;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const deckCollections = {
  kanji: {
    N5: kanjiList,
    N4: kanjiN4List,
    ALL: mergeUniqueCards(kanjiList, kanjiN4List)
  },
  vocabulary: {
    N5: vocabN5List,
    N4: vocabN4List,
    ALL: mergeUniqueCards(vocabN5List, vocabN4List)
  }
};

// State
let currentIndex = 0;
let currentDeck = [];
let wrongList = [];
let correctCount = 0;
let wrongCount = 0;
let quizMode = false;
let currentLevel = levelSelect.value;
let currentStudyType = studyTypeSelect.value;

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

function getAnsweredCount() {
  return correctCount + wrongCount;
}

function getCardPrompt(item) {
  return item.kanji || item.word;
}

function getCardAnswerLines(item) {
  if (item.word) {
    return [
      item.meaning,
      `Reading: ${item.reading}`,
      `Type: ${item.type}`
    ];
  }

  return [
    item.meaning,
    `Onyomi: ${item.onyomi}`,
    `Kunyomi: ${item.kunyomi}`
  ];
}

function getDeckLabel() {
  return currentStudyType === 'vocabulary' ? 'vocabulary' : 'kanji';
}

function setAnswerDetails(item) {
  answerDisplay.replaceChildren();

  getCardAnswerLines(item).forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    answerDisplay.appendChild(paragraph);
  });
}

function showCompletionMessage() {
  kanjiDisplay.textContent = 'Done!';
  answerDisplay.replaceChildren();
  [
    'Session complete',
    `${correctCount} correct / ${wrongCount} wrong`,
    'Review wrong cards below, or change study type, level, or mode to restart.'
  ].forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    answerDisplay.appendChild(paragraph);
  });
  overlay.classList.add('hidden');
  hideElement(showAnswerBtn);
  hideElement(rightBtn);
  hideElement(wrongBtn);
  hideElement(choicesContainer);
}

function showMissingDeckMessage() {
  kanjiDisplay.textContent = 'No study data loaded!';
  answerDisplay.replaceChildren();
  kanjiDisplay.classList.add('status-message');
  hideElement(showAnswerBtn);
  hideElement(rightBtn);
  hideElement(wrongBtn);
  hideElement(choicesContainer);
  overlay.classList.add('hidden');
}

function showKanji(index) {
  const card = currentDeck[index];
  kanjiDisplay.textContent = getCardPrompt(card);
  kanjiDisplay.classList.remove('status-message');
  kanjiDisplay.classList.toggle('vocab-term', currentStudyType === 'vocabulary');
  answerDisplay.replaceChildren();
  overlay.classList.remove('hidden');

  if (quizMode) {
    hideElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
    showChoices(card);
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
  const remaining = Math.max(currentDeck.length - getAnsweredCount(), 0);
  remainingCountDisplay.textContent = `Remaining: ${remaining}`;
  const totalAnswered = getAnsweredCount();
  const success = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
  successRateDisplay.textContent = `Success: ${success}%`;
}

// Multiple-choice mode
function showChoices(correctKanji) {
  choicesContainer.replaceChildren();

  const wrongAnswers = currentDeck.filter(k => k !== correctKanji);
  shuffle(wrongAnswers);

  const allAnswers = [...wrongAnswers.slice(0, 3), correctKanji];
  shuffle(allAnswers);

  allAnswers.forEach((choice, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `${idx + 1}. ${choice.meaning}`;
    btn.dataset.correct = String(choice === correctKanji);

    btn.addEventListener('click', () => {
      if (btn.disabled) return;

      const allBtns = choicesContainer.querySelectorAll('button:not(.next-btn)');
      allBtns.forEach(b => b.disabled = true);

      allBtns.forEach(b => {
        if (b.dataset.correct === 'true') {
          b.classList.add('correct-answer');
        } else if (b === btn) {
          b.classList.add('wrong-answer');
        } else {
          b.classList.add('inactive-answer');
        }
      });

      if (choice === correctKanji) {
        correctCount++;
      } else {
        wrongList.push(correctKanji);
        wrongCount++;
      }
      updateCounters();

      setAnswerDetails(correctKanji);
      overlay.classList.add('hidden');

      const nextBtn = document.createElement('button');
      nextBtn.textContent = getAnsweredCount() === currentDeck.length ? 'Finish (N)' : 'Next (N)';
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
  setAnswerDetails(currentDeck[currentIndex]);
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
  wrongList.push(currentDeck[currentIndex]);
  wrongCount++;
  nextKanji();
});

function nextKanji() {
  currentIndex++;
  updateCounters();

  if (currentIndex >= currentDeck.length) {
    showCompletionMessage();
    return;
  }

  showKanji(currentIndex);
}

reviewBtn.addEventListener('click', showWrongList);

function showWrongList() {
  wrongContainer.replaceChildren();
  if (wrongList.length === 0) {
    wrongContainer.textContent = "No wrong cards yet!";
    return;
  }
  wrongList.forEach(k => {
    const card = document.createElement('div');
    card.className = 'wrong-card';

    const kanjiDiv = document.createElement('div');
    kanjiDiv.className = 'wrong-kanji';
    kanjiDiv.textContent = getCardPrompt(k);
    kanjiDiv.classList.toggle('vocab-term', Boolean(k.word));

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'wrong-details';
    getCardAnswerLines(k).forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      detailsDiv.appendChild(paragraph);
    });

    card.append(kanjiDiv, detailsDiv);
    wrongContainer.appendChild(card);
  });
}

function resetSession() {
  currentStudyType = studyTypeSelect.value;
  currentLevel = levelSelect.value;
  currentDeck = [...(deckCollections[currentStudyType]?.[currentLevel] || [])];

  toggleModeBtn.textContent = quizMode ? 'Switch to Flashcard Mode (T)' : 'Switch to Multiple Choice (T)';
  wrongTitle.textContent = `Review Wrong ${getDeckLabel()[0].toUpperCase()}${getDeckLabel().slice(1)}`;

  correctCount = 0;
  wrongCount = 0;
  wrongList = [];
  currentIndex = 0;
  wrongContainer.replaceChildren();

  shuffle(currentDeck);
  updateCounters();

  if (currentDeck.length === 0) {
    showMissingDeckMessage();
    return;
  }

  showKanji(currentIndex);
}

// Level and mode controls
studyTypeSelect.addEventListener('change', resetSession);
levelSelect.addEventListener('change', resetSession);

toggleModeBtn.addEventListener('click', () => {
  quizMode = !quizMode;
  resetSession();
});

// Keyboard Shortcuts
document.addEventListener('keydown', e => {
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;

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
    if (key === 'n') {
      const nextBtn = choicesContainer.querySelector('.next-btn');
      if (nextBtn) nextBtn.click();
    }
  }

  // Works in both modes
  if (key === 't') toggleModeBtn.click(); 
  if (key === 'r') reviewBtn.click();
});


// Init
resetSession();
