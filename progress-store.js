(function attachProgressStore(global) {
  const STORAGE_KEY = 'jlpt-flashcards-progress-v1';
  const SETTINGS_KEY = 'jlpt-flashcards-settings-v1';
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MINUTE_MS = 60 * 1000;
  let memoryStore = {};

  function getStorage() {
    try {
      if (!global.localStorage) return null;
      const testKey = `${STORAGE_KEY}:test`;
      global.localStorage.setItem(testKey, '1');
      global.localStorage.removeItem(testKey);
      return global.localStorage;
    } catch {
      return null;
    }
  }

  function readJson(key, fallback) {
    const storage = getStorage();
    try {
      const raw = storage ? storage.getItem(key) : memoryStore[key];
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    const serialized = JSON.stringify(value);
    const storage = getStorage();
    if (storage) {
      storage.setItem(key, serialized);
      return;
    }
    memoryStore[key] = serialized;
  }

  function readProgress() {
    const data = readJson(STORAGE_KEY, { cards: {} });
    return data && data.cards ? data : { cards: {} };
  }

  function writeProgress(data) {
    writeJson(STORAGE_KEY, data);
  }

  function getDefaultStats() {
    return {
      attempts: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      ease: 2,
      intervalDays: 0,
      dueAt: null,
      lastSeenAt: null,
      lastResult: null
    };
  }

  function getCardStats(card) {
    const data = readProgress();
    return {
      ...getDefaultStats(),
      ...(data.cards[card.id] || {})
    };
  }

  function getNextIntervalDays(stats, isCorrect) {
    if (!isCorrect) return 0;
    if (stats.streak <= 0) return 1;
    if (stats.intervalDays <= 0) return 2;
    return Math.max(2, Math.round(stats.intervalDays * stats.ease));
  }

  function recordAnswer(card, isCorrect, now = Date.now()) {
    const data = readProgress();
    const previous = {
      ...getDefaultStats(),
      ...(data.cards[card.id] || {})
    };
    const streak = isCorrect ? previous.streak + 1 : 0;
    const ease = Math.min(2.8, Math.max(1.3, previous.ease + (isCorrect ? 0.08 : -0.22)));
    const intervalDays = getNextIntervalDays({ ...previous, streak, ease }, isCorrect);

    const nextStats = {
      ...previous,
      attempts: previous.attempts + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
      wrong: previous.wrong + (isCorrect ? 0 : 1),
      streak,
      ease,
      intervalDays,
      dueAt: isCorrect ? now + intervalDays * DAY_MS : now + 10 * MINUTE_MS,
      lastSeenAt: now,
      lastResult: isCorrect ? 'correct' : 'wrong'
    };

    data.cards[card.id] = nextStats;
    writeProgress(data);
    return nextStats;
  }

  function getStudyScore(card, now = Date.now()) {
    const stats = getCardStats(card);
    if (stats.attempts === 0) return 900;

    const dueAt = stats.dueAt || 0;
    const daysOverdue = Math.max(0, (now - dueAt) / DAY_MS);
    const daysUntilDue = Math.max(0, (dueAt - now) / DAY_MS);
    const accuracy = stats.attempts === 0 ? 0 : stats.correct / stats.attempts;
    const weakness = (1 - accuracy) * 250;
    const overdueBoost = dueAt <= now ? 420 + daysOverdue * 80 : -daysUntilDue * 28;

    return overdueBoost + weakness + stats.wrong * 16 + Math.random();
  }

  function sortDeckForStudy(deck) {
    return [...deck]
      .map(card => ({ card, score: getStudyScore(card) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.card);
  }

  function getDeckProgress(deck, now = Date.now()) {
    return deck.reduce((summary, card) => {
      const stats = getCardStats(card);
      if (stats.attempts === 0) {
        summary.newCards++;
        return summary;
      }

      summary.seen++;
      summary.correct += stats.correct;
      summary.wrong += stats.wrong;
      if (!stats.dueAt || stats.dueAt <= now) summary.dueNow++;
      return summary;
    }, {
      seen: 0,
      newCards: 0,
      correct: 0,
      wrong: 0,
      dueNow: 0
    });
  }

  function saveSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
  }

  function getSettings() {
    return readJson(SETTINGS_KEY, null);
  }

  function clearProgress() {
    writeProgress({ cards: {} });
  }

  global.ProgressStore = {
    clearProgress,
    getCardStats,
    getDeckProgress,
    getSettings,
    recordAnswer,
    saveSettings,
    sortDeckForStudy
  };
})(globalThis);
