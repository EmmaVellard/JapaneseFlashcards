const {
  buildDecks,
  createQuizQuestion,
  getCardAnswerLines,
  getCardPrompt,
  shuffle
} = StudyUtils;

// DOM Elements
const kanjiDisplay = document.getElementById('kanji-display');
const answerDisplay = document.getElementById('answer-display');
const overlay = document.getElementById('overlay');
const showAnswerBtn = document.getElementById('show-answer');
const rightBtn = document.getElementById('right');
const wrongBtn = document.getElementById('wrong');
const wrongSection = document.getElementById('wrong-section');
const wrongContainer = document.getElementById('wrong-cards');
const choicesContainer = document.getElementById('choices');
const toggleModeBtn = document.getElementById('toggle-mode');
const levelSelect = document.getElementById('level-select');
const studyTypeSelect = document.getElementById('study-type-select');
const wrongTitle = document.getElementById('wrong-title');
const savedProgressDisplay = document.getElementById('saved-progress');
const resetProgressBtn = document.getElementById('reset-progress');
const sessionSummaryDisplay = document.getElementById('session-summary');
const sessionProgressBar = document.getElementById('session-progress-bar');
const questionTypeChip = document.getElementById('question-type-chip');

const correctCountDisplay = document.getElementById('correct-count');
const wrongCountDisplay = document.getElementById('wrong-count');
const remainingCountDisplay = document.getElementById('remaining-count');
const successRateDisplay = document.getElementById('success-rate');

const deckCollections = buildDecks({
  kanjiN5: kanjiList,
  kanjiN4: kanjiN4List,
  vocabN5: vocabN5List,
  vocabN4: vocabN4List
});

// State
let currentIndex = 0;
let currentDeck = [];
let wrongList = [];
let correctCount = 0;
let wrongCount = 0;
let quizMode = false;
let currentQuestion = null;
let currentLevel = levelSelect.value;
let currentStudyType = studyTypeSelect.value;

function restoreSavedSettings() {
  const settings = ProgressStore.getSettings();
  if (!settings) return;

  if (deckCollections[settings.studyType]) {
    studyTypeSelect.value = settings.studyType;
  }

  if (deckCollections[studyTypeSelect.value]?.[settings.level]) {
    levelSelect.value = settings.level;
  }

  quizMode = Boolean(settings.quizMode);
}

function saveCurrentSettings() {
  ProgressStore.saveSettings({
    studyType: currentStudyType,
    level: currentLevel,
    quizMode
  });
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

function setCardPrompt(item) {
  const prompt = quizMode && currentQuestion ? currentQuestion.prompt : getCardPrompt(item);
  const showPromptReading = quizMode && currentQuestion?.showPromptReading;

  kanjiDisplay.replaceChildren();
  kanjiDisplay.classList.remove('text-prompt', 'japanese-answer');

  if (showPromptReading) {
    const reading = document.createElement('span');
    reading.className = 'prompt-reading';
    reading.textContent = item.reading;

    const word = document.createElement('span');
    word.className = 'prompt-main';
    word.textContent = prompt;

    kanjiDisplay.append(reading, word);
    return;
  }

  kanjiDisplay.textContent = prompt;
  kanjiDisplay.classList.toggle('text-prompt', currentQuestion?.promptKind === 'text');
}

function getDeckLabel() {
  return currentStudyType === 'vocabulary' ? 'vocabulary' : 'kanji';
}

function getQuestionChipLabel() {
  if (!quizMode) return 'Flashcard';
  return currentQuestion?.label.replace('?', '') || 'Quiz';
}

function updateQuestionChip(label = getQuestionChipLabel()) {
  questionTypeChip.textContent = label;
  questionTypeChip.dataset.mode = quizMode ? 'quiz' : 'flashcard';
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
  const progress = ProgressStore.getDeckProgress(currentDeck);
  kanjiDisplay.textContent = 'Done!';
  kanjiDisplay.classList.remove('with-reading', 'text-prompt');
  updateQuestionChip('Complete');
  answerDisplay.replaceChildren();
  [
    'Session complete',
    `${correctCount} correct / ${wrongCount} wrong`,
    `${progress.seen}/${currentDeck.length} cards now have saved progress`
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
  updateQuestionChip('No data');
  hideElement(showAnswerBtn);
  hideElement(rightBtn);
  hideElement(wrongBtn);
  hideElement(choicesContainer);
  overlay.classList.add('hidden');
}

function showKanji(index) {
  const card = currentDeck[index];
  currentQuestion = quizMode ? createQuizQuestion(card, currentDeck) : null;

  updateQuestionChip();
  setCardPrompt(card);
  kanjiDisplay.classList.remove('status-message');
  kanjiDisplay.classList.toggle('vocab-term', currentStudyType === 'vocabulary' && currentQuestion?.promptKind !== 'text');
  kanjiDisplay.classList.toggle('with-reading', Boolean(currentQuestion?.showPromptReading));
  answerDisplay.replaceChildren();
  overlay.classList.remove('hidden');

  if (quizMode) {
    hideElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
    showChoices(card);
  } else {
    overlay.dataset.label = '?';
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

  const progress = ProgressStore.getDeckProgress(currentDeck);
  savedProgressDisplay.textContent = `Saved: ${progress.seen}/${currentDeck.length} seen`;
  sessionSummaryDisplay.textContent = `${currentDeck.length} cards • ${totalAnswered} studied • ${remaining} remaining`;
  sessionProgressBar.style.width = `${currentDeck.length === 0 ? 0 : Math.round((totalAnswered / currentDeck.length) * 100)}%`;
}

function recordAnswer(card, isCorrect) {
  ProgressStore.recordAnswer(card, isCorrect);

  if (isCorrect) {
    correctCount++;
  } else {
    wrongList.push(card);
    wrongCount++;
  }

  updateCounters();
}

function createChoiceButton(answer, idx, correctAnswer) {
  const btn = document.createElement('button');
  btn.textContent = `${idx + 1}. ${answer}`;
  btn.dataset.correct = String(answer === correctAnswer);
  btn.classList.toggle('japanese-choice', currentQuestion.answerKind === 'japanese');

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

    recordAnswer(currentDeck[currentIndex], answer === correctAnswer);
    setAnswerDetails(currentDeck[currentIndex]);
    overlay.classList.add('hidden');

    const nextBtn = document.createElement('button');
    nextBtn.textContent = getAnsweredCount() === currentDeck.length ? 'Finish' : 'Next';
    nextBtn.classList.add('next-btn');
    nextBtn.addEventListener('click', nextKanji);
    choicesContainer.appendChild(nextBtn);
  });

  return btn;
}

// Multiple-choice mode
function showChoices(correctCard) {
  choicesContainer.replaceChildren();
  overlay.dataset.label = currentQuestion.label;

  currentQuestion.choices.forEach((answer, idx) => {
    choicesContainer.appendChild(createChoiceButton(answer, idx, currentQuestion.answer));
  });

  showElement(choicesContainer);
}

function nextKanji() {
  currentIndex++;
  updateCounters();

  if (currentIndex >= currentDeck.length) {
    showCompletionMessage();
    return;
  }

  showKanji(currentIndex);
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
  recordAnswer(currentDeck[currentIndex], true);
  nextKanji();
});

wrongBtn.addEventListener('click', () => {
  recordAnswer(currentDeck[currentIndex], false);
  nextKanji();
});

wrongSection.addEventListener('toggle', () => {
  if (wrongSection.open) showWrongList();
});

resetProgressBtn.addEventListener('click', () => {
  if (!confirm('Clear saved progress for all cards?')) return;
  ProgressStore.clearProgress();
  resetSession();
});

function showWrongList() {
  wrongContainer.replaceChildren();
  if (wrongList.length === 0) {
    wrongContainer.textContent = 'No wrong cards yet!';
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

function openWrongReview() {
  wrongSection.open = true;
  showWrongList();
}

function resetSession() {
  currentStudyType = studyTypeSelect.value;
  currentLevel = levelSelect.value;
  const selectedDeck = deckCollections[currentStudyType]?.[currentLevel] || [];
  currentDeck = ProgressStore.sortDeckForStudy(shuffle([...selectedDeck]));

  toggleModeBtn.textContent = quizMode ? 'Switch to Flashcard Mode' : 'Switch to Multiple Choice';
  wrongTitle.textContent = `Review Wrong ${getDeckLabel()[0].toUpperCase()}${getDeckLabel().slice(1)}`;

  correctCount = 0;
  wrongCount = 0;
  wrongList = [];
  currentIndex = 0;
  currentQuestion = null;
  wrongSection.open = false;
  wrongContainer.replaceChildren();
  saveCurrentSettings();
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
    if (key === 's' && !showAnswerBtn.classList.contains('hidden')) showAnswerBtn.click();
    if (key === 'c' && !rightBtn.classList.contains('hidden')) rightBtn.click();
    if (key === 'w' && !wrongBtn.classList.contains('hidden')) wrongBtn.click();
  } else {
    if (['1', '2', '3', '4'].includes(key)) {
      const index = parseInt(key, 10) - 1;
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

  if (key === 't') toggleModeBtn.click();
  if (key === 'r') openWrongReview();
});

// Init
restoreSavedSettings();
resetSession();
