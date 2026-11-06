// Exercise the real practice script against a small DOM adapter. This checks
// state transitions and answer visibility without adding runtime dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let document;
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.className = '';
    this.children = [];
    this.events = {};
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.value = '';
    this._text = '';
    const owner = this;
    this.classList = {
      contains(name) {
        return owner.className.split(/\s+/).includes(name);
      },
      add(...names) {
        owner.className = [
          ...new Set([
            ...owner.className.split(/\s+/).filter(Boolean),
            ...names
          ])
        ].join(' ');
      },
      remove(...names) {
        owner.className = owner.className
          .split(/\s+/)
          .filter((name) => !names.includes(name))
          .join(' ');
      },
      toggle(name, force) {
        const add = force === undefined ? !this.contains(name) : Boolean(force);
        if (add) this.add(name);
        else this.remove(name);
        return add;
      }
    };
  }
  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }
  get textContent() {
    return (
      this._text +
      this.children
        .map((child) => (typeof child === 'string' ? child : child.textContent))
        .join('')
    );
  }
  replaceChildren(...children) {
    this._text = '';
    this.children = children;
  }
  append(...children) {
    this.children.push(...children);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  addEventListener(name, listener) {
    (this.events[name] ||= []).push(listener);
  }
  dispatch(name) {
    for (const listener of this.events[name] || []) listener({ target: this });
  }
  click() {
    if (!this.disabled) this.dispatch('click');
  }
  focus() {
    document.activeElement = this;
  }
  querySelectorAll(selector) {
    const descendants = this.children
      .filter((child) => typeof child !== 'string')
      .flatMap((child) => [child, ...child.querySelectorAll('*')]);
    if (selector === '*') return descendants;
    if (selector.startsWith('button'))
      return descendants.filter(
        (child) =>
          child.tagName === 'BUTTON' &&
          (selector !== 'button:not(.next-btn)' ||
            !child.classList.contains('next-btn'))
      );
    if (selector === '.next-btn')
      return descendants.filter((child) =>
        child.classList.contains('next-btn')
      );
    const option = selector.match(/^option\[value="([^"]+)"\]$/);
    return option
      ? descendants.filter(
          (child) => child.tagName === 'OPTION' && child.value === option[1]
        )
      : [];
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}
const elements = new Map();
for (const match of html.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
  const element = new Element(match[1]);
  element.className = match[2].match(/\bclass="([^"]*)"/)?.[1] || '';
  elements.set(match[3], element);
}
for (const match of html.matchAll(
  /<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g
)) {
  const select = elements.get(match[1]);
  for (const option of match[2].matchAll(
    /<option\b[^>]*value="([^"]+)"[^>]*>([\s\S]*?)<\/option>/g
  )) {
    const element = new Element('option');
    element.value = option[1];
    element.textContent = option[2];
    select.appendChild(element);
  }
  select.value = select.children[0].value;
}
document = {
  getElementById(id) {
    assert.ok(elements.has(id), `HTML provides #${id}`);
    return elements.get(id);
  },
  createElement(tag) {
    return new Element(tag);
  },
  addEventListener() {}
};
const saved = new Map();
const context = vm.createContext({
  document,
  window: { matchMedia: () => ({ matches: false }) },
  localStorage: {
    getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, String(value)),
    removeItem: (key) => saved.delete(key)
  },
  confirm: () => true
});
for (const file of [
  'Lists/kanjiN5.js',
  'Lists/kanjiN4.js',
  'Lists/vocabN5.js',
  'Lists/vocabN4.js',
  'study-utils.js',
  'progress-store.js',
  'script.js'
]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {
    filename: file
  });
}
const evaluate = (code) => vm.runInContext(code, context);
const el = (id) => elements.get(id);
const hidden = (id) => el(id).classList.contains('hidden');
const change = (id, value) => {
  el(id).value = value;
  el(id).dispatch('change');
};
assert.equal(evaluate('currentDeck.length'), 10, 'Start with ten cards');
change('session-size-select', 'all');
assert.equal(
  evaluate('currentDeck.length'),
  84,
  'All cards removes the session cap'
);
assert.equal(evaluate('ProgressStore.getSettings().sessionSize'), 'all');
el('session-size-select').value = '10';
evaluate('restoreSavedSettings()');
assert.equal(
  el('session-size-select').value,
  'all',
  'Restore the all-cards preference'
);
assert.ok(
  hidden('example-section'),
  'An example never reveals the question in advance'
);
change('session-size-select', '20');
assert.equal(evaluate('currentDeck.length'), 20);
el('show-answer').click();
assert.equal(
  hidden('example-section'),
  false,
  'Reveal the example with the answer'
);
assert.ok(el('example-section').children.some((child) => child.lang === 'ja'));
assert.ok(el('example-section').children.some((child) => child.lang === 'en'));
for (let i = 0; i < 20; i++) {
  if (!hidden('show-answer')) el('show-answer').click();
  el('right').click();
  if (i < 19)
    assert.ok(
      hidden('example-section'),
      'Reset the example for each new question'
    );
}
assert.equal(hidden('restart-session'), false);
assert.ok(hidden('example-section'), 'No stale example on completion');
assert.match(el('session-summary').textContent, /20 studied/);
assert.match(
  el('saved-progress').textContent,
  /20\/84/,
  'Saved progress covers the whole level'
);
el('restart-session').click();
assert.equal(evaluate('currentDeck.length'), 20);
assert.equal(
  evaluate(
    'currentDeck.every(card => ProgressStore.getCardStats(card).attempts === 0)'
  ),
  true,
  'The next session excludes future reviews'
);
assert.equal(evaluate('ProgressStore.getSettings().sessionSize'), 20);
change('session-size-select', 'all');
assert.equal(
  evaluate('currentDeck.length'),
  84,
  'Full-deck practice includes cards already scheduled for later'
);
assert.equal(evaluate('currentSession.scheduledCards'), 20);
change('session-size-select', '20');

// A one-card review queue still uses the full level for quiz distractors.
const fixture = evaluate(
  'JSON.stringify(Object.fromEntries(sourceDeck.map((card, index) => [card.id, { attempts: 1, correct: 1, wrong: 0, lastSeenAt: Date.now() - 1000, dueAt: index === 0 ? Date.now() - 1 : Date.now() + 86400000 }])))'
);
saved.set(
  'jlpt-flashcards-progress-v1',
  JSON.stringify({ cards: JSON.parse(fixture) })
);
change('study-focus-select', 'new');
assert.equal(evaluate('currentDeck.length'), 0);
assert.equal(
  hidden('change-focus'),
  false,
  'An empty new queue offers due reviews'
);
assert.equal(el('change-focus').dataset.focus, 'review');
el('change-focus').click();
assert.equal(evaluate('currentDeck.length'), 1);
el('quiz-mode').click();
assert.equal(el('choices').querySelectorAll('button:not(.next-btn)').length, 4);
assert.ok(hidden('example-section'));
el('choices').querySelectorAll('button:not(.next-btn)')[0].click();
assert.equal(hidden('example-section'), false);
el('choices').querySelector('.next-btn').click();
el('restart-session').click();
assert.equal(
  evaluate('currentDeck.length'),
  0,
  'An empty due queue stays empty'
);
assert.equal(hidden('show-answer'), true);
assert.ok(hidden('example-section'));
assert.match(el('kanji-display').textContent, /caught up/i);

// Marking a revealed flashcard provides immediate and scheduled review.
change('study-focus-select', 'daily');
change('session-size-select', 'all');
el('flashcard-mode').click();
const reviewCard = evaluate('currentDeck[currentIndex]');
el('show-answer').click();
assert.ok(el('example-section').textContent.includes('Example sentence'));
const markedAt = Date.now();
el('wrong').click();
assert.equal(el('wrong-title').textContent, 'Review this session (1)');
assert.equal(evaluate('wrongList[0].id'), reviewCard.id);
const reviewDueAt = evaluate('ProgressStore.getCardStats(wrongList[0]).dueAt');
assert.ok(reviewDueAt >= markedAt + 600000);
assert.ok(reviewDueAt <= Date.now() + 600000);
evaluate('showWrongList()');
assert.ok(el('wrong-cards').textContent.includes(reviewCard.example.ja));
assert.match(el('settings-preview').textContent, /all cards/i);

const originalSessionIds = evaluate('currentDeck.map(card => card.id).join()');
const savedHistory = saved.get('jlpt-flashcards-progress-v1');
el('reset-session').click();
assert.equal(
  evaluate('currentDeck.map(card => card.id).join()'),
  originalSessionIds
);
assert.equal(evaluate('currentIndex'), 0);
assert.equal(el('wrong-title').textContent, 'Review this session (0)');
assert.match(el('session-summary').textContent, /0 studied/);
assert.ok(hidden('example-section'));
assert.equal(hidden('show-answer'), false);
assert.equal(
  saved.get('jlpt-flashcards-progress-v1'),
  savedHistory,
  'Reset session keeps saved history and review dates'
);

el('quiz-mode').click();
el('choices').querySelectorAll('button:not(.next-btn)')[0].click();
const quizHistory = saved.get('jlpt-flashcards-progress-v1');
el('reset-session').click();
assert.ok(hidden('example-section'));
assert.equal(el('choices').querySelectorAll('button:not(.next-btn)').length, 4);
assert.ok(
  el('choices')
    .querySelectorAll('button:not(.next-btn)')
    .every((button) => !button.disabled)
);
assert.equal(saved.get('jlpt-flashcards-progress-v1'), quizHistory);

context.confirm = () => false;
el('reset-progress').click();
assert.equal(
  saved.get('jlpt-flashcards-progress-v1'),
  quizHistory,
  'Cancelling the reset keeps every saved result'
);
context.confirm = () => true;
el('reset-progress').click();
assert.equal(evaluate('ProgressStore.getDeckProgress(sourceDeck).seen'), 0);
assert.equal(evaluate('ProgressStore.getSettings().sessionSize'), 'all');
console.log('Practice flow tests passed.');
