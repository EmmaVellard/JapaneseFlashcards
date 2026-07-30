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

assert.equal(decks.kanji.N5[0].kind, 'kanji');
assert.equal(decks.vocabulary.N4[0].level, 'N4');
assert.ok(decks.vocabulary.N5[0].id);

function assertQuestionWorks(deck, type) {
  const card = deck.find(item => StudyUtils.getAvailableQuestionTypes(item, deck).includes(type));
  assert.ok(card, `expected a card that supports ${type}`);

  const question = StudyUtils.createQuizQuestion(card, deck, type);
  assert.equal(question.choices.length, 4);
  assert.ok(question.choices.includes(question.answer), `${type} includes the correct answer`);
  assert.equal(new Set(question.choices).size, 4, `${type} choices are unique`);
  assert.notEqual(question.prompt, '', `${type} prompt is present`);
  assert.notEqual(question.answer, '', `${type} answer is present`);
}

['meaning', 'reading', 'meaning-to-japanese', 'reading-to-japanese'].forEach(type => {
  assertQuestionWorks(decks.vocabulary.ALL, type);
  assertQuestionWorks(decks.kanji.ALL, type);
});

const vocabWithKanji = decks.vocabulary.ALL.find(item => item.word !== item.reading);
const meaningQuestion = StudyUtils.createQuizQuestion(vocabWithKanji, decks.vocabulary.ALL, 'meaning');
const readingQuestion = StudyUtils.createQuizQuestion(vocabWithKanji, decks.vocabulary.ALL, 'reading');
assert.equal(meaningQuestion.showPromptReading, true);
assert.equal(readingQuestion.showPromptReading, false);

const statsAfterWrong = ProgressStore.recordAnswer(vocabWithKanji, false, 1000);
assert.equal(statsAfterWrong.wrong, 1);
assert.equal(statsAfterWrong.streak, 0);
assert.ok(statsAfterWrong.dueAt > 1000);

const statsAfterCorrect = ProgressStore.recordAnswer(vocabWithKanji, true, 2000);
assert.equal(statsAfterCorrect.correct, 1);
assert.equal(statsAfterCorrect.streak, 1);
assert.ok(statsAfterCorrect.dueAt > statsAfterWrong.dueAt);

const progress = ProgressStore.getDeckProgress(decks.vocabulary.ALL, 3000);
assert.equal(progress.seen, 1);
assert.ok(progress.newCards > 0);

console.log('All logic tests passed.');
