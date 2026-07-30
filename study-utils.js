(function attachStudyUtils(global) {
  const HIRAGANA_RE = /[\u3040-\u309f]/;
  const KATAKANA_RE = /[\u30a0-\u30ff]/;
  const KANJI_RE = /[\u3400-\u9fff]/;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getCardPrompt(item) {
    return item.kanji || item.word || '';
  }

  function slugify(text) {
    return encodeURIComponent(text).replace(/%/g, '').toLowerCase();
  }

  function createCard(item, kind, level) {
    const prompt = getCardPrompt(item);
    return {
      ...item,
      id: `${kind}-${level}-${slugify(prompt)}`,
      kind,
      level
    };
  }

  function mergeUniqueCards(...lists) {
    const seen = new Set();
    return lists.flat().filter(item => {
      const key = `${item.kind}:${getCardPrompt(item)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildDecks(sources) {
    const kanjiN5 = (sources.kanjiN5 || []).map(item => createCard(item, 'kanji', 'N5'));
    const kanjiN4 = (sources.kanjiN4 || []).map(item => createCard(item, 'kanji', 'N4'));
    const vocabN5 = (sources.vocabN5 || []).map(item => createCard(item, 'vocabulary', 'N5'));
    const vocabN4 = (sources.vocabN4 || []).map(item => createCard(item, 'vocabulary', 'N4'));

    return {
      kanji: {
        N5: kanjiN5,
        N4: kanjiN4,
        ALL: mergeUniqueCards(kanjiN5, kanjiN4)
      },
      vocabulary: {
        N5: vocabN5,
        N4: vocabN4,
        ALL: mergeUniqueCards(vocabN5, vocabN4)
      }
    };
  }

  function getJapaneseAnswer(item) {
    return getCardPrompt(item);
  }

  function getReadingAnswer(item) {
    if (item.word) {
      return item.reading;
    }

    return [
      item.onyomi && `Onyomi: ${item.onyomi}`,
      item.kunyomi && `Kunyomi: ${item.kunyomi}`
    ].filter(Boolean).join(' / ');
  }

  function getCardAnswerLines(item) {
    if (item.word) {
      return [
        item.meaning,
        `Reading: ${item.reading}`,
        `Type: ${item.type}`,
        `Level: ${item.level}`
      ];
    }

    return [
      item.meaning,
      `Onyomi: ${item.onyomi}`,
      `Kunyomi: ${item.kunyomi}`,
      `Level: ${item.level}`
    ];
  }

  function hasUsefulReadingQuestion(item) {
    if (item.word) {
      return Boolean(item.reading && item.reading !== item.word);
    }

    return Boolean(item.onyomi || item.kunyomi);
  }

  const questionDefinitions = {
    meaning: {
      label: 'Meaning?',
      promptKind: 'japanese',
      answerKind: 'text',
      getPrompt: getCardPrompt,
      getAnswer: item => item.meaning,
      isAvailable: () => true,
      showPromptReading: item => Boolean(item.word && item.reading && item.reading !== item.word)
    },
    reading: {
      label: 'Reading?',
      promptKind: 'japanese',
      answerKind: 'text',
      getPrompt: getCardPrompt,
      getAnswer: getReadingAnswer,
      isAvailable: hasUsefulReadingQuestion,
      showPromptReading: () => false
    },
    'meaning-to-japanese': {
      label: 'Japanese?',
      promptKind: 'text',
      answerKind: 'japanese',
      getPrompt: item => item.meaning,
      getAnswer: getJapaneseAnswer,
      isAvailable: item => Boolean(item.meaning),
      showPromptReading: () => false
    },
    'reading-to-japanese': {
      label: 'Which word?',
      promptKind: 'text',
      answerKind: 'japanese',
      getPrompt: getReadingAnswer,
      getAnswer: getJapaneseAnswer,
      isAvailable: hasUsefulReadingQuestion,
      showPromptReading: () => false
    }
  };

  function getQuizAnswer(item, questionType) {
    return questionDefinitions[questionType].getAnswer(item);
  }

  function getUniqueWrongAnswers(correctCard, deck, questionType) {
    const correctAnswer = getQuizAnswer(correctCard, questionType);
    const seen = new Set();

    return deck.reduce((answers, item) => {
      if (item === correctCard) return answers;

      const answer = getQuizAnswer(item, questionType);
      if (!answer || answer === correctAnswer || seen.has(answer)) return answers;

      seen.add(answer);
      answers.push(answer);
      return answers;
    }, []);
  }

  function getAvailableQuestionTypes(card, deck) {
    return Object.keys(questionDefinitions).filter(questionType => {
      const definition = questionDefinitions[questionType];
      return definition.isAvailable(card) && getUniqueWrongAnswers(card, deck, questionType).length >= 3;
    });
  }

  function pickQuestionType(card, deck) {
    const availableTypes = getAvailableQuestionTypes(card, deck);
    const fallbackTypes = availableTypes.length > 0 ? availableTypes : ['meaning'];
    return fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
  }

  function buildChoices(card, deck, questionType) {
    const answer = getQuizAnswer(card, questionType);
    const wrongAnswers = getUniqueWrongAnswers(card, deck, questionType);
    shuffle(wrongAnswers);
    return shuffle([...wrongAnswers.slice(0, 3), answer]);
  }

  function createQuizQuestion(card, deck, questionType = pickQuestionType(card, deck)) {
    const definition = questionDefinitions[questionType];

    return {
      type: questionType,
      label: definition.label,
      prompt: definition.getPrompt(card),
      promptKind: definition.promptKind,
      answer: definition.getAnswer(card),
      answerKind: definition.answerKind,
      choices: buildChoices(card, deck, questionType),
      showPromptReading: definition.showPromptReading(card)
    };
  }

  function getWritingSystem(item) {
    const text = item.word || item.kanji || '';
    if (KANJI_RE.test(text)) return item.word ? 'kanji-word' : 'kanji';
    if (KATAKANA_RE.test(text)) return 'katakana';
    if (HIRAGANA_RE.test(text)) return 'hiragana';
    return 'other';
  }

  function normalizeText(text) {
    return String(text || '').trim().toLowerCase();
  }

  function getSearchText(item) {
    return normalizeText([
      item.kanji,
      item.word,
      item.reading,
      item.meaning,
      item.onyomi,
      item.kunyomi,
      item.type,
      item.level,
      getWritingSystem(item)
    ].filter(Boolean).join(' '));
  }

  global.StudyUtils = {
    buildChoices,
    buildDecks,
    createQuizQuestion,
    getAvailableQuestionTypes,
    getCardAnswerLines,
    getCardPrompt,
    getJapaneseAnswer,
    getReadingAnswer,
    getSearchText,
    getUniqueWrongAnswers,
    getWritingSystem,
    hasUsefulReadingQuestion,
    mergeUniqueCards,
    normalizeText,
    pickQuestionType,
    shuffle
  };
})(globalThis);
