const { buildDecks, createQuizQuestion, getCardAnswerLines, getCardPrompt } =
  StudyUtils;

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
const flashcardModeBtn = document.getElementById('flashcard-mode');
const quizModeBtn = document.getElementById('quiz-mode');
const modeDescription = document.getElementById('mode-description');
const modeShortcuts = document.getElementById('mode-shortcuts');
const restartSessionBtn = document.getElementById('restart-session');
const deckLabelDisplay = document.getElementById('deck-label');
const sessionPercentage = document.getElementById('session-percentage');
const sessionProgress = document.getElementById('session-progress');
const levelSelect = document.getElementById('level-select');
const studyTypeSelect = document.getElementById('study-type-select');
const wrongTitle = document.getElementById('wrong-title');
const savedProgressDisplay = document.getElementById('saved-progress');
const resetProgressBtn = document.getElementById('reset-progress');
const resetSessionBtn = document.getElementById('reset-session');
const sessionSummaryDisplay = document.getElementById('session-summary');
const sessionProgressBar = document.getElementById('session-progress-bar');
const questionTypeChip = document.getElementById('question-type-chip');
const sessionSizeSelect = document.getElementById('session-size-select');
const studyFocusSelect = document.getElementById('study-focus-select');
const queueSummary = document.getElementById('queue-summary');
const sessionComposition = document.getElementById('session-composition');
const changeFocusBtn = document.getElementById('change-focus');
const exampleSection = document.getElementById('example-section');
const studySettings = document.getElementById('study-settings');
const settingsPreview = document.getElementById('settings-preview');

const compactLayout = window.matchMedia('(max-width: 760px)');
if (compactLayout.matches) studySettings.open = false;
compactLayout.addEventListener?.('change', (event) => {
  studySettings.open = !event.matches;
});

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
let sourceDeck = [];
let currentSession = null;
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
  if (
    settings.sessionSize === 'all' ||
    [10, 20].includes(Number(settings.sessionSize))
  ) {
    sessionSizeSelect.value = String(settings.sessionSize);
  }
  if (['daily', 'review', 'new'].includes(settings.studyFocus)) {
    studyFocusSelect.value = settings.studyFocus;
  }
}

function saveCurrentSettings() {
  ProgressStore.saveSettings({
    studyType: currentStudyType,
    level: currentLevel,
    quizMode,
    sessionSize:
      sessionSizeSelect.value === 'all'
        ? 'all'
        : Number(sessionSizeSelect.value),
    studyFocus: studyFocusSelect.value
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
  const prompt =
    quizMode && currentQuestion ? currentQuestion.prompt : getCardPrompt(item);
  const showPromptReading = quizMode && currentQuestion?.showPromptReading;

  kanjiDisplay.replaceChildren();
  kanjiDisplay.lang =
    currentQuestion?.type === 'meaning-to-japanese' ? 'en' : 'ja';
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
  kanjiDisplay.classList.toggle(
    'text-prompt',
    currentQuestion?.promptKind === 'text'
  );
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

  getCardAnswerLines(item).forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    answerDisplay.appendChild(paragraph);
  });
  exampleSection.replaceChildren();
  if (item.example) {
    const label = document.createElement('p');
    label.className = 'example-label';
    label.textContent = 'Example sentence';
    const japanese = document.createElement('p');
    japanese.className = 'example-japanese';
    japanese.lang = 'ja';
    japanese.textContent = item.example.ja;
    const translation = document.createElement('p');
    translation.className = 'example-translation';
    translation.lang = 'en';
    translation.textContent = item.example.en;
    exampleSection.append(label, japanese, translation);
    if (item.example.tatoebaId) {
      const source = document.createElement('a');
      source.className = 'example-source';
      source.href = `https://tatoeba.org/en/sentences/show/${item.example.tatoebaId}`;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Tatoeba';
      exampleSection.appendChild(source);
    }
    showElement(exampleSection);
  } else {
    hideElement(exampleSection);
  }
}

function showCompletionMessage() {
  hideElement(exampleSection);
  const progress = ProgressStore.getDeckProgress(currentDeck);
  kanjiDisplay.textContent = 'Done!';
  kanjiDisplay.lang = 'en';
  kanjiDisplay.classList.remove('with-reading', 'text-prompt', 'vocab-term');
  kanjiDisplay.classList.add('status-message');
  updateQuestionChip('Complete');
  answerDisplay.replaceChildren();
  [
    'Session complete',
    `${correctCount} correct / ${wrongCount} wrong`,
    `${progress.seen}/${currentDeck.length} cards now have saved progress`
  ].forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    answerDisplay.appendChild(paragraph);
  });
  overlay.classList.add('hidden');
  hideElement(showAnswerBtn);
  hideElement(rightBtn);
  hideElement(wrongBtn);
  hideElement(choicesContainer);
  showElement(restartSessionBtn);
  restartSessionBtn.textContent = 'Next session';
}

function showEmptySession() {
  const progress = ProgressStore.getDeckProgress(sourceDeck);
  const newOnly = studyFocusSelect.value === 'new';
  kanjiDisplay.textContent = newOnly ? 'All explored.' : 'All caught up.';
  kanjiDisplay.lang = 'en';
  kanjiDisplay.className = 'card-left status-message';
  updateQuestionChip('Ready when you are');
  answerDisplay.replaceChildren();
  const heading = document.createElement('p');
  heading.textContent = newOnly
    ? 'No new cards left'
    : 'No reviews due right now';
  const note = document.createElement('p');
  note.textContent =
    progress.newCards > 0
      ? `${progress.newCards} new cards are ready to explore.`
      : progress.dueNow > 0
        ? `${progress.dueNow} cards are ready for review.`
        : 'Your next reviews are scheduled for later. Take a break and come back soon.';
  answerDisplay.append(heading, note);
  overlay.classList.add('hidden');
  [showAnswerBtn, rightBtn, wrongBtn, choicesContainer, exampleSection].forEach(
    hideElement
  );
  const nextFocus =
    newOnly && progress.dueNow > 0
      ? 'review'
      : progress.newCards > 0
        ? 'new'
        : null;
  if (nextFocus) {
    changeFocusBtn.dataset.focus = nextFocus;
    changeFocusBtn.textContent =
      nextFocus === 'review' ? 'Review due cards' : 'Study new cards';
    showElement(changeFocusBtn);
  } else {
    restartSessionBtn.textContent = 'Check again';
    showElement(restartSessionBtn);
  }
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
  hideElement(restartSessionBtn);
  hideElement(exampleSection);
  // Answer choices come from the full level, even when just one card remains
  // due. A short session must still have four choices and homograph context.
  currentQuestion = quizMode ? createQuizQuestion(card, sourceDeck) : null;

  updateQuestionChip();
  setCardPrompt(card);
  kanjiDisplay.classList.remove('status-message');
  kanjiDisplay.classList.toggle(
    'vocab-term',
    currentStudyType === 'vocabulary' && currentQuestion?.promptKind !== 'text'
  );
  kanjiDisplay.classList.toggle(
    'with-reading',
    Boolean(currentQuestion?.showPromptReading)
  );
  answerDisplay.replaceChildren();
  overlay.classList.remove('hidden');

  if (quizMode) {
    hideElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
    showChoices(card);
  } else {
    overlay.dataset.label = 'Take a moment.\nWhat does this one mean?';
    hideElement(choicesContainer);
    showElement(showAnswerBtn);
    hideElement(rightBtn);
    hideElement(wrongBtn);
  }
}

function updateCounters() {
  resetSessionBtn.disabled = currentDeck.length === 0;
  wrongTitle.textContent = `Review this session (${wrongList.length})`;
  correctCountDisplay.textContent = `Correct: ${correctCount}`;
  wrongCountDisplay.textContent = `Wrong: ${wrongCount}`;
  const remaining = Math.max(currentDeck.length - getAnsweredCount(), 0);
  remainingCountDisplay.textContent = `Remaining: ${remaining}`;
  const totalAnswered = getAnsweredCount();
  const success =
    totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
  successRateDisplay.textContent = `Success: ${success}%`;

  const progress = ProgressStore.getDeckProgress(sourceDeck);
  savedProgressDisplay.textContent = `Saved: ${progress.seen}/${sourceDeck.length} seen`;
  queueSummary.textContent = `${progress.dueNow} due · ${progress.newCards} new`;
  studyFocusSelect.querySelector('option[value="review"]').textContent =
    `Due reviews only (${progress.dueNow})`;
  studyFocusSelect.querySelector('option[value="new"]').textContent =
    `New cards only (${progress.newCards})`;
  studyFocusSelect.querySelector('option[value="daily"]').textContent =
    sessionSizeSelect.value === 'all' ? 'Full deck practice' : 'Daily practice';
  sessionSummaryDisplay.textContent = `${currentDeck.length} cards · ${totalAnswered} studied · ${remaining} remaining`;
  const percentage =
    currentDeck.length === 0
      ? 0
      : Math.round((totalAnswered / currentDeck.length) * 100);
  sessionProgressBar.style.width = `${percentage}%`;
  sessionPercentage.textContent = `${percentage}%`;
  sessionProgress.setAttribute('aria-valuenow', String(percentage));
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
  btn.classList.toggle(
    'japanese-choice',
    currentQuestion.answerKind === 'japanese'
  );

  btn.addEventListener('click', () => {
    if (btn.disabled) return;

    const allBtns = choicesContainer.querySelectorAll('button:not(.next-btn)');
    allBtns.forEach((b) => (b.disabled = true));

    allBtns.forEach((b) => {
      if (b.dataset.correct === 'true') {
        b.classList.add('correct-answer');
        b.textContent += ' ✓';
      } else if (b === btn) {
        b.classList.add('wrong-answer');
        b.textContent += ' ✕';
      } else {
        b.classList.add('inactive-answer');
      }
    });

    recordAnswer(currentDeck[currentIndex], answer === correctAnswer);
    setAnswerDetails(currentDeck[currentIndex]);
    overlay.classList.add('hidden');

    const nextBtn = document.createElement('button');
    nextBtn.textContent =
      getAnsweredCount() === currentDeck.length ? 'Finish' : 'Next';
    nextBtn.classList.add('next-btn');
    nextBtn.addEventListener('click', nextKanji);
    choicesContainer.appendChild(nextBtn);
    nextBtn.focus({ preventScroll: true });
    if (compactLayout.matches) nextBtn.scrollIntoView({ block: 'nearest' });
  });

  return btn;
}

// Multiple-choice mode
function showChoices(correctCard) {
  choicesContainer.replaceChildren();
  overlay.dataset.label = `${currentQuestion.label}\nChoose an answer below.`;

  currentQuestion.choices.forEach((answer, idx) => {
    choicesContainer.appendChild(
      createChoiceButton(answer, idx, currentQuestion.answer)
    );
  });

  showElement(choicesContainer);
}

function nextKanji() {
  currentIndex++;
  updateCounters();

  if (currentIndex >= currentDeck.length) {
    showCompletionMessage();
    restartSessionBtn.focus({ preventScroll: true });
    return;
  }

  showKanji(currentIndex);
  const nextAction = quizMode
    ? choicesContainer.querySelector('button')
    : showAnswerBtn;
  nextAction?.focus({ preventScroll: true });
  if (compactLayout.matches && deckLabelDisplay.getBoundingClientRect().top < 0)
    deckLabelDisplay.scrollIntoView({ block: 'start' });
}

// Event Handlers
showAnswerBtn.addEventListener('click', () => {
  setAnswerDetails(currentDeck[currentIndex]);
  overlay.classList.add('hidden');
  hideElement(showAnswerBtn);
  showElement(rightBtn);
  showElement(wrongBtn);
  rightBtn.focus({ preventScroll: true });
  if (compactLayout.matches) rightBtn.scrollIntoView({ block: 'nearest' });
});

restartSessionBtn.addEventListener('click', () => {
  resetSession();
  const nextAction = quizMode
    ? choicesContainer.querySelector('button')
    : currentDeck.length
      ? showAnswerBtn
      : changeFocusBtn.classList.contains('hidden')
        ? restartSessionBtn
        : changeFocusBtn;
  nextAction?.focus({ preventScroll: true });
});

changeFocusBtn.addEventListener('click', () => {
  studyFocusSelect.value = changeFocusBtn.dataset.focus;
  resetSession();
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
  if (
    !confirm(
      'Reset saved progress for all kanji and vocabulary on this device? This clears review dates and answer history.'
    )
  )
    return;
  ProgressStore.clearProgress();
  resetSession();
});

resetSessionBtn.addEventListener('click', () => {
  resetSession({ reuseCards: true });
  const nextAction = quizMode
    ? choicesContainer.querySelector('button')
    : showAnswerBtn;
  nextAction?.focus({ preventScroll: true });
  if (compactLayout.matches)
    deckLabelDisplay.scrollIntoView({ block: 'start' });
});

function showWrongList() {
  wrongContainer.replaceChildren();
  if (wrongList.length === 0) {
    wrongContainer.textContent = 'No wrong cards yet!';
    return;
  }

  wrongList.forEach((k) => {
    const card = document.createElement('div');
    card.className = 'wrong-card';

    const kanjiDiv = document.createElement('div');
    kanjiDiv.className = 'wrong-kanji';
    kanjiDiv.textContent = getCardPrompt(k);
    kanjiDiv.classList.toggle('vocab-term', Boolean(k.word));

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'wrong-details';
    getCardAnswerLines(k).forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      detailsDiv.appendChild(paragraph);
    });
    if (k.example) {
      const sentence = document.createElement('p');
      sentence.lang = 'ja';
      sentence.className = 'review-example';
      sentence.textContent = k.example.ja;
      detailsDiv.appendChild(sentence);
    }

    card.append(kanjiDiv, detailsDiv);
    wrongContainer.appendChild(card);
  });
}

function openWrongReview() {
  wrongSection.open = true;
  showWrongList();
}

function resetSession({ reuseCards = false } = {}) {
  currentStudyType = studyTypeSelect.value;
  currentLevel = levelSelect.value;
  settingsPreview.textContent = `${getDeckLabel()} · ${currentLevel === 'ALL' ? 'N5 + N4' : currentLevel} · ${sessionSizeSelect.value === 'all' ? 'All cards' : sessionSizeSelect.value + ' cards'}`;
  sourceDeck = deckCollections[currentStudyType]?.[currentLevel] || [];
  if (reuseCards) {
    // Replaying a session keeps its cards, even if answers just moved them to
    // future review dates. This does not erase the saved learning history.
    currentSession = ProgressStore.buildStudySession(currentDeck, {
      size: 'all'
    });
    currentSession.cards = currentDeck;
  } else {
    currentSession = ProgressStore.buildStudySession(sourceDeck, {
      size:
        sessionSizeSelect.value === 'all'
          ? 'all'
          : Number(sessionSizeSelect.value),
      focus: studyFocusSelect.value
    });
  }
  currentDeck = currentSession.cards;
  sessionComposition.textContent = [
    currentSession.reviewCards
      ? `${currentSession.reviewCards} due ${currentSession.reviewCards === 1 ? 'review' : 'reviews'}`
      : '',
    currentSession.newCards
      ? `${currentSession.newCards} new ${currentSession.newCards === 1 ? 'card' : 'cards'}`
      : '',
    currentSession.scheduledCards
      ? `${currentSession.scheduledCards} extra ${currentSession.scheduledCards === 1 ? 'review' : 'reviews'}`
      : ''
  ]
    .filter(Boolean)
    .join(' + ');

  flashcardModeBtn.setAttribute('aria-pressed', String(!quizMode));
  quizModeBtn.setAttribute('aria-pressed', String(quizMode));
  modeDescription.textContent = quizMode
    ? 'Choose from four answers. A new way to test what you know.'
    : 'Recall the meaning and readings, then reveal the answer.';
  modeShortcuts.replaceChildren();
  const shortcutKey = document.createElement('kbd');
  shortcutKey.textContent = quizMode ? '1–4' : 'S';
  modeShortcuts.append(
    shortcutKey,
    quizMode ? ' Choose an answer' : ' Reveal answer'
  );
  deckLabelDisplay.textContent = `${getDeckLabel()} / JLPT ${currentLevel === 'ALL' ? 'N5 + N4' : currentLevel}`;
  hideElement(restartSessionBtn);
  hideElement(changeFocusBtn);
  hideElement(exampleSection);

  correctCount = 0;
  wrongCount = 0;
  wrongList = [];
  currentIndex = 0;
  currentQuestion = null;
  wrongSection.open = false;
  wrongContainer.replaceChildren();
  saveCurrentSettings();
  updateCounters();

  if (sourceDeck.length === 0) {
    showMissingDeckMessage();
    return;
  }
  if (currentDeck.length === 0) {
    showEmptySession();
    return;
  }

  showKanji(currentIndex);
}

// Level and mode controls
studyTypeSelect.addEventListener('change', resetSession);
levelSelect.addEventListener('change', resetSession);
sessionSizeSelect.addEventListener('change', resetSession);
studyFocusSelect.addEventListener('change', resetSession);

function setStudyMode(nextQuizMode) {
  if (quizMode === nextQuizMode) return;
  quizMode = nextQuizMode;
  resetSession();
}

flashcardModeBtn.addEventListener('click', () => setStudyMode(false));
quizModeBtn.addEventListener('click', () => setStudyMode(true));

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  const tag = e.target?.tagName?.toLowerCase();
  if (
    tag === 'input' ||
    tag === 'select' ||
    tag === 'textarea' ||
    e.target?.isContentEditable ||
    e.repeat ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;

  const key = e.key.toLowerCase();

  if (!quizMode) {
    if (key === 's' && !showAnswerBtn.classList.contains('hidden'))
      showAnswerBtn.click();
    if (key === 'c' && !rightBtn.classList.contains('hidden')) rightBtn.click();
    if (key === 'w' && !wrongBtn.classList.contains('hidden')) wrongBtn.click();
  } else {
    if (['1', '2', '3', '4'].includes(key)) {
      const index = parseInt(key, 10) - 1;
      const choiceButtons = choicesContainer.querySelectorAll(
        'button:not(.next-btn)'
      );
      if (choiceButtons[index] && !choiceButtons[index].disabled) {
        choiceButtons[index].click();
      }
    }
    if (key === 'n') {
      const nextBtn = choicesContainer.querySelector('.next-btn');
      if (nextBtn) nextBtn.click();
    }
  }

  if (key === 't') setStudyMode(!quizMode);
  if (key === 'r') openWrongReview();
});

// Init
restoreSavedSettings();
resetSession();
