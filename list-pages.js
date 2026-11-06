const {
  buildDecks,
  hasPartOfSpeech,
  getSearchText,
  getWritingSystem,
  normalizeText
} = StudyUtils;

const listDecks = buildDecks({
  kanjiN5: typeof kanjiList === 'undefined' ? [] : kanjiList,
  kanjiN4: typeof kanjiN4List === 'undefined' ? [] : kanjiN4List,
  vocabN5: typeof vocabN5List === 'undefined' ? [] : vocabN5List,
  vocabN4: typeof vocabN4List === 'undefined' ? [] : vocabN4List
});

const pageType = document.body.dataset.listPage;
const pageDeck = listDecks[pageType];

const listControls = {
  search: document.getElementById('list-search'),
  level: document.getElementById('level-filter'),
  script: document.getElementById('script-filter'),
  type: document.getElementById('type-filter'),
  sort: document.getElementById('sort-filter'),
  clear: document.getElementById('clear-list-filters')
};

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function createCell(text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function createBadgeCell(text, className) {
  const cell = createCell('', className);
  const parts = Array.isArray(text)
    ? text.map((part) => String(part).trim()).filter(Boolean)
    : String(text || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

  parts.forEach((part) => {
    const badge = document.createElement('span');
    badge.className = 'table-badge';
    badge.textContent = part;
    cell.appendChild(badge);
  });

  return cell;
}

function createEmptyRow(colspan, message) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.className = 'empty-row';
  td.colSpan = colspan;
  td.textContent = message;
  tr.appendChild(td);
  return tr;
}

function renderRows(tbodyId, rows, mapCells, emptyMessage) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const fragment = document.createDocumentFragment();
  if (rows.length === 0) {
    fragment.appendChild(createEmptyRow(mapCells.colspan || 4, emptyMessage));
  } else {
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      mapCells(row).forEach((cell) => tr.appendChild(cell));
      fragment.appendChild(tr);
    });
  }

  tbody.replaceChildren(fragment);
}

function getFilterState() {
  return {
    search: normalizeText(listControls.search?.value || ''),
    level: listControls.level?.value || 'ALL',
    script: listControls.script?.value || 'ALL',
    type: listControls.type?.value || 'ALL',
    sort: listControls.sort?.value || 'default'
  };
}

function matchesFilters(item, state) {
  if (state.search && !getSearchText(item).includes(state.search)) return false;
  if (state.script !== 'ALL' && getWritingSystem(item) !== state.script)
    return false;
  if (state.type !== 'ALL' && !hasPartOfSpeech(item, state.type)) return false;
  return true;
}

function getSortValue(item, sort) {
  const values = {
    japanese: item.kanji || item.word,
    reading: item.reading,
    meaning: item.meaning,
    onyomi: item.onyomi,
    kunyomi: item.kunyomi,
    type: item.type
  };

  return normalizeText(values[sort] || '');
}

function sortRows(rows, sort) {
  if (sort === 'default') return rows;
  return [...rows].sort((a, b) =>
    getSortValue(a, sort).localeCompare(getSortValue(b, sort))
  );
}

function getRowsForLevel(level, state) {
  if (state.level !== 'ALL' && state.level !== level) return [];
  return sortRows(
    pageDeck[level].filter((item) => matchesFilters(item, state)),
    state.sort
  );
}

function updateSection(sectionId, visible) {
  const section = document.getElementById(sectionId);
  if (section) section.classList.toggle('hidden', !visible);
}

function renderKanjiLists() {
  const state = getFilterState();
  const n5Rows = getRowsForLevel('N5', state);
  const n4Rows = getRowsForLevel('N4', state);

  setText('kanji-n5-count', `(${n5Rows.length} of ${pageDeck.N5.length})`);
  setText('kanji-n4-count', `(${n4Rows.length} of ${pageDeck.N4.length})`);
  updateSection('n5-kanji', state.level === 'ALL' || state.level === 'N5');
  updateSection('n4-kanji', state.level === 'ALL' || state.level === 'N4');

  const kanjiCells = (item) => [
    createCell(item.kanji, 'table-japanese table-kanji'),
    createCell(item.meaning),
    createCell(item.onyomi, 'table-reading'),
    createCell(item.kunyomi, 'table-reading')
  ];
  kanjiCells.colspan = 4;

  renderRows(
    'kanji-n5-body',
    n5Rows,
    kanjiCells,
    'No N5 kanji match these filters.'
  );
  renderRows(
    'kanji-n4-body',
    n4Rows,
    kanjiCells,
    'No N4 kanji match these filters.'
  );
}

function renderVocabularyLists() {
  const state = getFilterState();
  const n5Rows = getRowsForLevel('N5', state);
  const n4Rows = getRowsForLevel('N4', state);

  setText('vocab-n5-count', `(${n5Rows.length} of ${pageDeck.N5.length})`);
  setText('vocab-n4-count', `(${n4Rows.length} of ${pageDeck.N4.length})`);
  updateSection('n5-vocabulary', state.level === 'ALL' || state.level === 'N5');
  updateSection('n4-vocabulary', state.level === 'ALL' || state.level === 'N4');

  const vocabCells = (item) => [
    createCell(item.word, 'table-japanese'),
    createCell(item.reading, 'table-reading'),
    createCell(item.meaning),
    createBadgeCell([
      getWritingSystem(item).replace('-', ' '),
      ...item.type.split(',')
    ])
  ];
  vocabCells.colspan = 4;

  renderRows(
    'vocab-n5-body',
    n5Rows,
    vocabCells,
    'No N5 vocabulary matches these filters.'
  );
  renderRows(
    'vocab-n4-body',
    n4Rows,
    vocabCells,
    'No N4 vocabulary matches these filters.'
  );
}

function renderPage() {
  if (pageType === 'kanji') renderKanjiLists();
  if (pageType === 'vocabulary') renderVocabularyLists();
}

function setupListFilters() {
  Object.values(listControls).forEach((control) => {
    if (!control || control === listControls.clear) return;
    control.addEventListener('input', renderPage);
    control.addEventListener('change', renderPage);
  });

  listControls.clear?.addEventListener('click', () => {
    if (listControls.search) listControls.search.value = '';
    if (listControls.level) listControls.level.value = 'ALL';
    if (listControls.script) listControls.script.value = 'ALL';
    if (listControls.type) listControls.type.value = 'ALL';
    if (listControls.sort) listControls.sort.value = 'default';
    renderPage();
    window.SelectControls?.refresh();
  });
}

function setupBackToTopButton() {
  const button = document.querySelector('.back-to-top');
  if (!button) return;

  const toggleButton = () => {
    const visible = window.scrollY > 320;
    button.classList.toggle('is-visible', visible);
    button.tabIndex = visible ? 0 : -1;
    button.setAttribute('aria-hidden', String(!visible));
  };

  window.addEventListener('scroll', toggleButton, { passive: true });
  window.addEventListener('load', toggleButton);
  window.addEventListener('resize', toggleButton);
  toggleButton();
}

setupListFilters();
renderPage();
setupBackToTopButton();
