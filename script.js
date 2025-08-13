let kanjiList = [];
let filteredList = [];
let currentIndex = 0;
let showBack = false;
let filterType = 'all';

// Charger les données
fetch('kanjin5.json')
  .then(res => res.json())
  .then(data => {
    kanjiList = data;
    applyFilter();
  });

// Appliquer un filtre
function applyFilter() {
  const known = JSON.parse(localStorage.getItem('known')) || [];
  const unknown = JSON.parse(localStorage.getItem('unknown')) || [];
  const review = JSON.parse(localStorage.getItem('review')) || [];

  if (filterType === 'known') {
    filteredList = kanjiList.filter(k => known.includes(k.kanji));
  } else if (filterType === 'unknown') {
    filteredList = kanjiList.filter(k => unknown.includes(k.kanji));
  } else if (filterType === 'review') {
    filteredList = kanjiList.filter(k => review.includes(k.kanji));
  } else {
    filteredList = [...kanjiList];
  }

  currentIndex = 0;
  loadCard();
}

// Charger la carte actuelle
function loadCard() {
  if (filteredList.length === 0) {
    document.getElementById('card-front').textContent = 'Aucun kanji';
    document.getElementById('card-back').textContent = '';
    return;
  }

  const cardFront = document.getElementById('card-front');
  const cardBack = document.getElementById('card-back');
  
  cardFront.textContent = filteredList[currentIndex].kanji;
  cardBack.innerHTML = `
    <strong>Onyomi:</strong> ${filteredList[currentIndex].onyomi}<br>
    <strong>Kunyomi:</strong> ${filteredList[currentIndex].kunyomi}<br>
    <strong>Signification:</strong> ${filteredList[currentIndex].meaning}
  `;

  showBack = false;
  cardFront.style.display = 'flex';
  cardBack.style.display = 'none';
}

// Cliquer pour retourner la carte
document.getElementById('flashcard').addEventListener('click', () => {
  showBack = !showBack;
  document.getElementById('card-front').style.display = showBack ? 'none' : 'flex';
  document.getElementById('card-back').style.display = showBack ? 'flex' : 'none';
});

// Navigation
document.getElementById('next').addEventListener('click', () => {
  if (filteredList.length > 0) {
    currentIndex = (currentIndex + 1) % filteredList.length;
    loadCard();
  }
});

document.getElementById('prev').addEventListener('click', () => {
  if (filteredList.length > 0) {
    currentIndex = (currentIndex - 1 + filteredList.length) % filteredList.length;
    loadCard();
  }
});

// Sauvegarder dans une catégorie
function saveCategory(category) {
  let stored = JSON.parse(localStorage.getItem(category)) || [];
  const currentKanji = filteredList[currentIndex].kanji;
  if (!stored.includes(currentKanji)) {
    stored.push(currentKanji);
    localStorage.setItem(category, JSON.stringify(stored));
  }
}

document.getElementById('know').addEventListener('click', () => saveCategory('known'));
document.getElementById('dontknow').addEventListener('click', () => saveCategory('unknown'));
document.getElementById('review').addEventListener('click', () => saveCategory('review'));

// Filtrage
document.getElementById('filter').addEventListener('change', (e) => {
  filterType = e.target.value;
  applyFilter();
});