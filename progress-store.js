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

  function getCardStats(card, data = readProgress()) {
    // New stable IDs can reuse progress saved under a previous spelling, level,
    // or an old compound incorrectly stored as a kanji. Keep the latest record
    // when a character used to appear in both decks; never count it twice.
    const saved =
      data.cards[card.id] ||
      (card.legacyIds || [])
        .map((id) => data.cards[id])
        .filter(Boolean)
        .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0))[0];
    return {
      ...getDefaultStats(),
      ...(saved || {})
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
    const previous = getCardStats(card, data);
    const streak = isCorrect ? previous.streak + 1 : 0;
    const ease = Math.min(
      2.8,
      Math.max(1.3, previous.ease + (isCorrect ? 0.08 : -0.22))
    );
    const intervalDays = getNextIntervalDays(
      { ...previous, streak, ease },
      isCorrect
    );

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

  function getStudyScore(card, now = Date.now(), data = readProgress()) {
    const stats = getCardStats(card, data);
    if (stats.attempts === 0) return 900;

    const dueAt = stats.dueAt || 0;
    const daysOverdue = Math.max(0, (now - dueAt) / DAY_MS);
    const daysUntilDue = Math.max(0, (dueAt - now) / DAY_MS);
    const accuracy = stats.attempts === 0 ? 0 : stats.correct / stats.attempts;
    const weakness = (1 - accuracy) * 250;
    const overdueBoost =
      dueAt <= now ? 420 + daysOverdue * 80 : -daysUntilDue * 28;

    return overdueBoost + weakness + stats.wrong * 16 + Math.random();
  }

  function sortDeckForStudy(deck) {
    const data = readProgress();
    const now = Date.now();
    return [...deck]
      .map((card) => ({ card, score: getStudyScore(card, now, data) }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.card);
  }

  function buildStudySession(
    deck,
    { size = 10, focus = 'daily' } = {},
    now = Date.now()
  ) {
    const data = readProgress();
    const due = [];
    const fresh = [];
    const scheduled = [];
    for (const card of deck) {
      const stats = getCardStats(card, data);
      if (stats.attempts === 0) fresh.push(card);
      else if (!stats.dueAt || stats.dueAt <= now) due.push(card);
      else scheduled.push(card);
    }
    const rankedDue = due
      .map((card) => ({ card, score: getStudyScore(card, now, data) }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.card);
    // Shuffle new cards without mutating the source deck. Due reviews always
    // precede new material. Full-deck practice can also include future reviews;
    // the short daily sessions leave those cards scheduled for later.
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    const candidates =
      focus === 'review'
        ? rankedDue
        : focus === 'new'
          ? fresh
          : [...rankedDue, ...fresh, ...(size === 'all' ? scheduled : [])];
    const limit = size === 'all' ? candidates.length : size === 20 ? 20 : 10;
    const cards = candidates.slice(0, limit);
    const dueIds = new Set(due.map((card) => card.id));
    const freshIds = new Set(fresh.map((card) => card.id));
    const scheduledIds = new Set(scheduled.map((card) => card.id));
    return {
      cards,
      dueCount: due.length,
      newCount: fresh.length,
      scheduledCount: scheduled.length,
      reviewCards: cards.filter((card) => dueIds.has(card.id)).length,
      newCards: cards.filter((card) => freshIds.has(card.id)).length,
      scheduledCards: cards.filter((card) => scheduledIds.has(card.id)).length
    };
  }

  function getDeckProgress(deck, now = Date.now()) {
    const data = readProgress();
    return deck.reduce(
      (summary, card) => {
        const stats = getCardStats(card, data);
        if (stats.attempts === 0) {
          summary.newCards++;
          return summary;
        }

        summary.seen++;
        summary.correct += stats.correct;
        summary.wrong += stats.wrong;
        if (!stats.dueAt || stats.dueAt <= now) summary.dueNow++;
        return summary;
      },
      {
        seen: 0,
        newCards: 0,
        correct: 0,
        wrong: 0,
        dueNow: 0
      }
    );
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
    buildStudySession,
    clearProgress,
    getCardStats,
    getDeckProgress,
    getSettings,
    recordAnswer,
    saveSettings,
    sortDeckForStudy
  };
})(globalThis);
