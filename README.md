# Japanese Flashcards

A quiet space to practice **JLPT N5 and N4 kanji and vocabulary** with flashcards, multiple-choice quizzes, searchable reference lists, and saved study progress.

[Open Japanese Flashcards](https://emmavellard.github.io/JapaneseFlashcards/)

## Practice

Choose **Kanji** or **Vocabulary**, then **N5**, **N4**, or **N5 + N4**. Choose a session length of **10 cards**, **20 cards**, or **All cards**.

- **Daily practice:** due reviews first, then new cards if there is room.
- **Due reviews only:** study only cards whose review date has arrived.
- **New cards only:** study cards you have not answered yet.

Short sessions leave future reviews scheduled. **All cards** with **Full deck practice** includes the whole selected deck, including future reviews, with due cards first. The review-only and new-only filters still apply when selected. An empty queue shows a caught-up message and offers the other queue when available.

- **Flashcards:** recall the meaning and readings, reveal the answer, then choose **Got it** or **Add to review**.
- **Multiple choice:** answer questions about meanings, readings, or Japanese words. Each question offers four choices and shows the correct answer after selection.
- **Session details:** check correct answers, mistakes, remaining cards, accuracy, and saved progress.
- **Review this session:** revisit the cards marked **Add to review** or missed in the quiz. These cards are also scheduled for another review in about 10 minutes; choose **Due reviews only** once they are due.
- **Next session:** start another short session from the remaining eligible cards.
- **Reset session:** restart the same cards and clear the session counters. Saved answer history and review dates are kept.
- **Reset saved progress:** clear answer history and review dates for all kanji and vocabulary on this device, after confirmation.

Cards appear once per session. Due reviews are ordered by overdue status and difficulty; new cards are shuffled. The session limit and focus are remembered alongside deck, level, and mode preferences. Deck, level, and mode preferences are remembered in the browser; changing them starts a new session. Progress is stored on the device using `localStorage`, with an in-memory fallback when storage is unavailable.

JLPT level lists are study references, rather than official fixed exam lists. The vocabulary decks cover a pinned community N5/N4 baseline with local corrections and supplementary cards. See [About the decks](sources.html) and [the content audit](docs/content-audit.md).

Every kanji and vocabulary card includes one Japanese example sentence and an English translation, revealed with the answer. In multiple-choice mode, the example stays hidden until a choice is made. Sentences are from Tatoeba via OpenJLPT or are original learner examples written for this app; source links are provided for Tatoeba sentences.

On small screens, **Study settings** starts collapsed so the card is immediately accessible. Tap it to change the deck, level, session length, focus, or practice mode. The menus use the site's theme and support touch, arrow keys, type-ahead, Enter, and Escape.

## Browse the collections

The **Kanji** and **Vocabulary** pages include every card in the decks. Search by Japanese, reading, or meaning; filter by level; and sort the results. Vocabulary also has writing-system and word-type filters.

## Keyboard shortcuts

| Key | Action                                      |
| --- | ------------------------------------------- |
| S   | Reveal a flashcard answer                   |
| C   | Mark a revealed flashcard correct           |
| W   | Mark a revealed flashcard for further study |
| 1–4 | Choose a quiz answer                        |
| N   | Next quiz question or finish                |
| T   | Switch practice mode                        |
| R   | Open the mistakes review                    |

## Design

The site shares the editorial design language of [Movie Companion](https://emmavellard.github.io/MovieCompanion/) and [Next Chapter](https://emmavellard.github.io/NextChapter/): Fraunces headings, Nunito interface text, open layouts, quiet dividers, and underlined navigation. A plum and lavender palette carries through the practice and reference pages.

The light or dark theme follows the system until a preference is selected. Fonts are bundled locally, with their SIL Open Font License notices in `assets/fonts/`. There are no runtime dependencies or external font requests.

Every page declares an opaque 180×180 PNG Apple touch icon and the Home Screen title **Japanese**, following [Apple's web app icon guidance](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html). On iPhone, use Safari's **Share → Add to Home Screen**. The icon artwork is saved in `assets/app-icon.png`; the iOS asset is `assets/apple-touch-icon.png`.

## Development

Open `index.html` directly in a browser, or serve the directory with any static server, for example:

```bash
python3 -m http.server 4324 --bind 127.0.0.1
```

Run the syntax checks and existing logic tests with:

```bash
npm run check
npm test
```

## Data quality and updates

The current decks contain 84 N5 and 169 N4 kanji, plus 681 N5 and 638 N4 vocabulary cards. See [data/README.md](data/README.md) for attribution, the pinned source version, and verification limits. Generated deck data use CC BY-SA 4.0.

After editing local corrections in `data/curation.json`, regenerate and test:

```bash
npm run build:decks
npm run check
npm test
```

## Main files

- `index.html`: practice interface.
- `kanji.html`, `vocabulary.html`: reference collections.
- `style.css`: shared layout, responsive styles, and theme colors.
- `theme.js`: system theme and saved appearance preference.
- `select-controls.js`: accessible themed menus shared by all pages.
- `script.js`: practice modes, scoring, shortcuts, and review.
- `study-utils.js`: card normalization, question generation, and shared deck helpers.
- `progress-store.js`: progress persistence and review scheduling.
- `list-pages.js`: reference search, filters, sorting, and rendering.
- `Lists/`: the N5 and N4 kanji and vocabulary decks.
- `tests/logic.test.js`: deck, quiz, progress, and session selection checks.
- `tests/practice.test.js`: practice flow, empty queues, quiz choices, and example visibility checks.
