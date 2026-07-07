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

function renderRows(tbodyId, rows, mapCells) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const fragment = document.createDocumentFragment();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    mapCells(row).forEach(cell => tr.appendChild(cell));
    fragment.appendChild(tr);
  });

  tbody.replaceChildren(fragment);
}

function renderKanjiLists() {
  setText('kanji-n5-count', `(${kanjiList.length})`);
  setText('kanji-n4-count', `(${kanjiN4List.length})`);

  const kanjiCells = item => [
    createCell(item.kanji, 'table-japanese table-kanji'),
    createCell(item.meaning),
    createCell(item.onyomi, 'table-reading'),
    createCell(item.kunyomi, 'table-reading')
  ];

  renderRows('kanji-n5-body', kanjiList, kanjiCells);
  renderRows('kanji-n4-body', kanjiN4List, kanjiCells);
}

function renderVocabularyLists() {
  setText('vocab-n5-count', `(${vocabN5List.length})`);
  setText('vocab-n4-count', `(${vocabN4List.length})`);

  const vocabCells = item => [
    createCell(item.word, 'table-japanese'),
    createCell(item.reading, 'table-reading'),
    createCell(item.meaning),
    createCell(item.type)
  ];

  renderRows('vocab-n5-body', vocabN5List, vocabCells);
  renderRows('vocab-n4-body', vocabN4List, vocabCells);
}

function setupBackToTopButton() {
  const button = document.querySelector('.back-to-top');
  if (!button) return;

  let lastScrollY = window.scrollY;

  const toggleButton = () => {
    const currentScrollY = window.scrollY;
    const isPastIntro = currentScrollY > 180;
    const isScrollingUp = currentScrollY < lastScrollY;

    button.classList.toggle('is-visible', isPastIntro && isScrollingUp);
    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', toggleButton, { passive: true });
  window.addEventListener('load', toggleButton);
  toggleButton();
}

const pageType = document.body.dataset.listPage;
if (pageType === 'kanji') renderKanjiLists();
if (pageType === 'vocabulary') renderVocabularyLists();
setupBackToTopButton();
