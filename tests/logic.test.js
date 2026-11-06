const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function load(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(source, { filename: file });
}

const localStorageData = new Map();
globalThis.localStorage = {
  getItem(key) {
    return localStorageData.has(key) ? localStorageData.get(key) : null;
  },
  setItem(key, value) {
    localStorageData.set(key, String(value));
  },
  removeItem(key) {
    localStorageData.delete(key);
  }
};

load('Lists/kanjiN5.js');
load('Lists/kanjiN4.js');
load('Lists/vocabN5.js');
load('Lists/vocabN4.js');
load('study-utils.js');
load('progress-store.js');

const decks = StudyUtils.buildDecks({
  kanjiN5: kanjiList,
  kanjiN4: kanjiN4List,
  vocabN5: vocabN5List,
  vocabN4: vocabN4List
});

const reference = JSON.parse(
  fs.readFileSync(path.join(root, 'data/openjlpt-n5-n4.json'), 'utf8')
);
const allCards = [...decks.kanji.ALL, ...decks.vocabulary.ALL];
for (const card of allCards) {
  assert.ok(
    card.example?.ja && card.example?.en,
    `Bilingual example for ${card.id}`
  );
  if (card.kanji)
    assert.ok(
      card.example.ja.includes(card.kanji),
      'A character appears in its example'
    );
  if (card.example.source === 'tatoeba')
    assert.ok(
      Number.isInteger(card.example.tatoebaId) && card.example.tatoebaId > 0
    );
  else assert.equal(card.example.source, 'local');
}
assert.equal(
  new Set(allCards.map((card) => card.id)).size,
  allCards.length,
  'All persisted card IDs are distinct'
);
for (const card of decks.kanji.ALL) {
  assert.match(
    card.kanji,
    /^\p{Script=Han}$/u,
    'Kanji decks contain one character, not compounds'
  );
  assert.ok(card.meaning && card.onyomi && card.kunyomi);
}
for (const card of decks.vocabulary.ALL) {
  assert.match(
    card.reading,
    /^[\p{Script=Hiragana}\p{Script=Katakana}ー・]+$/u,
    `Kana reading for ${card.word}`
  );
  assert.ok(
    card.meaning && card.type,
    `Complete vocabulary record for ${card.word}`
  );
}
assert.equal(decks.kanji.N5.length, 84);
assert.equal(decks.kanji.N4.length, 169);
assert.equal(decks.kanji.ALL.length, 253, 'N5 and N4 kanji are disjoint');
for (const character of [
  '人',
  '山',
  '川',
  '入',
  '出',
  '東',
  '西',
  '南',
  '北',
  '白',
  '父',
  '母'
]) {
  assert.ok(
    decks.kanji.N5.some((card) => card.kanji === character),
    `Core N5 character ${character}`
  );
}
for (const entry of reference.vocabulary) {
  assert.ok(
    decks.vocabulary[entry.level].some(
      (card) => card.id === `openjlpt-${entry.id}`
    ),
    `Reference coverage for ${entry.word}`
  );
}
for (const entry of reference.kanji) {
  assert.ok(
    decks.kanji[entry.level].some((card) => card.kanji === entry.character)
  );
}
const wordCard = (word, reading) =>
  decks.vocabulary.ALL.find(
    (card) => card.word === word && (!reading || card.reading === reading)
  );
assert.equal(wordCard('せっけん').meaning, 'soap');
assert.equal(wordCard('半分').meaning, 'half');
assert.equal(wordCard('ガス').meaning, 'gas');
assert.match(wordCard('一日', 'ついたち').meaning, /first day/);
assert.doesNotMatch(wordCard('一日', 'いちにち').meaning, /first/);
assert.match(wordCard('以下').meaning, /including/);
assert.match(wordCard('以上').meaning, /including/);
assert.match(wordCard('しかる').meaning, /scold/);
assert.match(wordCard('早い').meaning, /early/);
assert.match(wordCard('速い').meaning, /fast/);
assert.equal(
  decks.vocabulary.ALL.filter((card) => card.word === '明日').length,
  2,
  'Different readings survive combined-deck deduplication'
);
assert.equal(
  decks.vocabulary.ALL.filter((card) => card.word === '一日').length,
  2
);
assert.ok(
  !StudyUtils.getAvailableQuestionTypes(
    wordCard('開く', 'あく'),
    decks.vocabulary.ALL
  ).includes('reading'),
  'Do not ask an ambiguous bare-reading question'
);
assert.ok(
  !StudyUtils.getUniqueWrongAnswers(
    wordCard('はし'),
    decks.vocabulary.ALL,
    'reading-to-japanese'
  ).includes('橋'),
  'A homophone is not a wrong answer'
);
assert.ok(
  !StudyUtils.getUniqueWrongAnswers(
    wordCard('降りる'),
    decks.vocabulary.ALL,
    'reading-to-japanese'
  ).includes('下りる'),
  'Alternative spellings are not wrong answers'
);
assert.ok(
  !StudyUtils.getUniqueWrongAnswers(
    wordCard('降りる'),
    decks.vocabulary.ALL,
    'meaning-to-japanese'
  ).includes('下りる'),
  'Dictionary-equivalent spellings are not wrong answers to a meaning prompt'
);
assert.equal(
  StudyUtils.hasPartOfSpeech({ type: 'pronoun' }, 'noun'),
  false,
  'Noun filter does not also match pronouns'
);
assert.equal(
  StudyUtils.hasPartOfSpeech({ type: 'pre-noun adjective' }, 'noun'),
  false
);
assert.equal(
  StudyUtils.hasPartOfSpeech({ type: 'noun, suru verb' }, 'verb'),
  true
);
assert.equal(
  StudyUtils.hasPartOfSpeech({ type: 'i-adjective' }, 'adjective'),
  true
);

assert.equal(decks.kanji.N5[0].kind, 'kanji');
assert.equal(decks.vocabulary.N4[0].level, 'N4');
assert.ok(decks.vocabulary.N5[0].id);

function assertQuestionWorks(deck, type) {
  const card = deck.find((item) =>
    StudyUtils.getAvailableQuestionTypes(item, deck).includes(type)
  );
  assert.ok(card, `expected a card that supports ${type}`);

  const question = StudyUtils.createQuizQuestion(card, deck, type);
  assert.equal(question.choices.length, 4);
  assert.ok(
    question.choices.includes(question.answer),
    `${type} includes the correct answer`
  );
  assert.equal(new Set(question.choices).size, 4, `${type} choices are unique`);
  assert.notEqual(question.prompt, '', `${type} prompt is present`);
  assert.notEqual(question.answer, '', `${type} answer is present`);
}

['meaning', 'reading', 'meaning-to-japanese', 'reading-to-japanese'].forEach(
  (type) => {
    assertQuestionWorks(decks.vocabulary.ALL, type);
    assertQuestionWorks(decks.kanji.ALL, type);
  }
);

const vocabWithKanji = decks.vocabulary.ALL.find(
  (item) => item.word !== item.reading
);
const meaningQuestion = StudyUtils.createQuizQuestion(
  vocabWithKanji,
  decks.vocabulary.ALL,
  'meaning'
);
const readingQuestion = StudyUtils.createQuizQuestion(
  vocabWithKanji,
  decks.vocabulary.ALL,
  'reading'
);
assert.equal(meaningQuestion.showPromptReading, true);
assert.equal(readingQuestion.showPromptReading, false);

const statsAfterWrong = ProgressStore.recordAnswer(vocabWithKanji, false, 1000);
assert.equal(statsAfterWrong.wrong, 1);
assert.equal(statsAfterWrong.streak, 0);
assert.ok(statsAfterWrong.dueAt > 1000);

const statsAfterCorrect = ProgressStore.recordAnswer(
  vocabWithKanji,
  true,
  2000
);
assert.equal(statsAfterCorrect.correct, 1);
assert.equal(statsAfterCorrect.streak, 1);
assert.ok(statsAfterCorrect.dueAt > statsAfterWrong.dueAt);

const progress = ProgressStore.getDeckProgress(decks.vocabulary.ALL, 3000);
assert.equal(progress.seen, 1);
assert.ok(progress.newCards > 0);

// A changed level or spelling must not erase existing browser progress.
const moved = decks.kanji.N4.find((card) => card.kanji === '会');
assert.equal(moved.legacyIds.length, 2);
const legacyProgress = { cards: {} };
legacyProgress.cards[moved.legacyIds[0]] = {
  attempts: 4,
  correct: 3,
  wrong: 1,
  lastSeenAt: 1000
};
legacyProgress.cards[moved.legacyIds[1]] = {
  attempts: 6,
  correct: 5,
  wrong: 1,
  lastSeenAt: 2000
};
localStorageData.set(
  'jlpt-flashcards-progress-v1',
  JSON.stringify(legacyProgress)
);
assert.equal(
  ProgressStore.getCardStats(moved).attempts,
  6,
  'Reuse the most recent legacy record'
);
assert.equal(
  ProgressStore.getDeckProgress([moved]).seen,
  1,
  'Do not count former duplicates twice'
);
assert.equal(
  ProgressStore.recordAnswer(moved, true, 3000).attempts,
  7,
  'Continue the old history under the stable ID'
);
assert.equal(ProgressStore.getCardStats(moved).correct, 6);
const monday = wordCard('月曜日');
assert.ok(
  monday.legacyIds.some((id) => id.startsWith('kanji-N5-')),
  'Compound progress follows the word into vocabulary'
);
ProgressStore.clearProgress();
assert.equal(
  ProgressStore.getCardStats(moved).attempts,
  0,
  'Reset clears current and legacy progress'
);

const sessionNow = 1_000_000;
const sessionCards = decks.kanji.N5.slice(0, 30);
const sessionData = { cards: {} };
sessionCards.slice(0, 3).forEach((card) => {
  sessionData.cards[card.id] = {
    attempts: 1,
    correct: 1,
    wrong: 0,
    dueAt: sessionNow - 1
  };
});
sessionCards.slice(3, 6).forEach((card) => {
  sessionData.cards[card.id] = {
    attempts: 1,
    correct: 1,
    wrong: 0,
    dueAt: sessionNow + 86_400_000
  };
});
localStorageData.set(
  'jlpt-flashcards-progress-v1',
  JSON.stringify(sessionData)
);
const daily = ProgressStore.buildStudySession(
  sessionCards,
  { size: 10, focus: 'daily' },
  sessionNow
);
assert.equal(daily.cards.length, 10);
assert.equal(daily.reviewCards, 3);
assert.equal(daily.newCards, 7);
assert.equal(daily.scheduledCount, 3);
assert.ok(
  daily.cards
    .slice(0, 3)
    .every((card) => sessionCards.slice(0, 3).includes(card)),
  'Due reviews precede every new card'
);
assert.ok(
  daily.cards.every((card) => !sessionCards.slice(3, 6).includes(card)),
  'Future reviews never fill the session'
);
const reviewOnly = ProgressStore.buildStudySession(
  sessionCards,
  { size: 20, focus: 'review' },
  sessionNow
);
assert.equal(
  reviewOnly.cards.length,
  3,
  'A review session does not add new cards to reach its limit'
);
const newOnly = ProgressStore.buildStudySession(
  sessionCards,
  { size: 20, focus: 'new' },
  sessionNow
);
assert.equal(newOnly.cards.length, 20);
assert.equal(newOnly.reviewCards, 0);
assert.equal(new Set(newOnly.cards.map((card) => card.id)).size, 20);
const fullDeck = ProgressStore.buildStudySession(
  sessionCards,
  { size: 'all', focus: 'daily' },
  sessionNow
);
assert.equal(
  fullDeck.cards.length,
  30,
  'Full-deck practice includes every card, including future reviews'
);
assert.equal(fullDeck.reviewCards, 3);
assert.equal(fullDeck.newCards, 24);
assert.equal(fullDeck.scheduledCards, 3);
assert.ok(
  fullDeck.cards
    .slice(0, 3)
    .every((card) => sessionCards.slice(0, 3).includes(card)),
  'Full-deck practice still starts with due cards'
);
assert.equal(
  ProgressStore.buildStudySession(
    sessionCards,
    { size: 'all', focus: 'new' },
    sessionNow
  ).cards.length,
  24,
  'All cards respects the new-only filter'
);
assert.equal(
  ProgressStore.buildStudySession(
    sessionCards,
    { size: 'all', focus: 'review' },
    sessionNow
  ).cards.length,
  3,
  'All cards respects the due-only filter'
);
assert.equal(
  ProgressStore.buildStudySession(
    sessionCards.slice(3, 6),
    { focus: 'daily' },
    sessionNow
  ).cards.length,
  0,
  'An all-future deck is caught up'
);
assert.equal(
  ProgressStore.buildStudySession([], { focus: 'review' }, sessionNow).cards
    .length,
  0
);
ProgressStore.clearProgress();

console.log('All logic tests passed.');
