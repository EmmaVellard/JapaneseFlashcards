# Deck data and attribution

The browser decks in `Lists/` are derived from a pinned OpenJLPT snapshot and explicit local corrections. Regenerate them with `npm run build:decks`.

## Sources

- [OpenJLPT](https://github.com/evanclan/OpenJLPT), version 0.3.0, commit `0d1d3410bec90bd4098a7c72de820543cb4f707c`, retrieved 6 November 2026.
- [Jonathan Waller's community JLPT lists](https://www.tanos.co.uk/jlpt/), used by OpenJLPT for approximate level assignments and short vocabulary glosses.
- [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) and [KANJIDIC2](https://www.edrdg.org/wiki/KANJIDIC_Project.html), copyright the Electronic Dictionary Research and Development Group (EDRDG), used in accordance with the [EDRDG licence](https://www.edrdg.org/edrdg/licence.html).
- Upstream JMdict and KANJIDIC2 versions are dated 29 September 2026.

The redistributed dictionary data, corrections, and resulting decks are licensed under **CC BY-SA 4.0**. See [the licence](LICENSE-CC-BY-SA-4.0.txt) and [the upstream attribution notice](OPENJLPT-NOTICE.md). Tatoeba example sentences are selected through the pinned OpenJLPT vocabulary files. Their Japanese sentence IDs link to the original sentences and contributor attribution at `https://tatoeba.org/en/sentences/show/<id>`. Tatoeba sentences use [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). No grammar lessons, audio, or KanjiVG diagrams are imported by this app.

`openjlpt-n5-n4.json` retains the fields needed to reproduce the four decks. It is not a complete dictionary. `curation.json` contains 48 explicit source corrections or spelling improvements, 15 supplementary vocabulary cards, and the former browser progress IDs. Correct the curation file instead of editing generated decks directly.

## Coverage and limitations

The [JLPT organisers explain](https://jlpt.jp/e/faq/index.html) that they do not publish exhaustive current vocabulary, kanji, or grammar lists. These levels are community approximations. Coverage is complete **against the pinned OpenJLPT N5/N4 baseline**, with local additions; it is not a claim of exhaustive exam coverage or every possible Japanese meaning.

| Deck          | Cards |
| ------------- | ----: |
| N5 kanji      |    84 |
| N4 kanji      |   169 |
| N5 vocabulary |   681 |
| N4 vocabulary |   638 |

All 1,304 baseline vocabulary records and 253 baseline characters are retained. Fifteen vocabulary cards supplement that baseline. Homographs with different readings remain distinct; some spellings and lexical variants are therefore separate study cards rather than distinct dictionary lexemes.

KANJIDIC2 readings are retained, including less common readings, and use standard notation: katakana for on'yomi, hiragana for kun'yomi, a dot before okurigana, and hyphens for prefix/suffix use. These are dictionary readings, not a list of readings guaranteed at the corresponding exam level.

## Checks performed

- Compared all 486 original records with the reference, including accepted spelling/reading variants.
- Replaced every individual kanji's readings and English meanings with the pinned KANJIDIC2-derived record.
- Checked source coverage, required fields, single-character kanji, kana readings, duplicate IDs, and level separation.
- Reviewed short vocabulary glosses and applied targeted corrections to detected errors. JMdict linkage upstream is not proof that every short English gloss is correct; the source contains errors, and this app does not claim independent lexicographer verification of every sense.
- Preserved all original cards through stable IDs and 486 legacy progress aliases, including compounds moved to vocabulary. Where a kanji had two former records, the latest one is reused rather than summing duplicated histories.
- Kept genuine alternate readings (for example 明日 and 一日) distinct and excluded ambiguous bare-reading questions and same-reading distractors.

## Correction references

The local corrections use concise learner glosses. Problematic entries were checked against dictionary references including:

- [石鹸 / せっけん: soap](https://dictionary.cambridge.org/dictionary/japanese-english/石鹸).
- [半分: half](https://dictionary.cambridge.org/dictionary/japanese-english/半分).
- [一日: いちにち versus ついたち](https://dictionary.cambridge.org/dictionary/japanese-english/一日).
- [以下: inclusive upper bound](https://dictionary.cambridge.org/ja/dictionary/japanese-english/以下) and [以上: inclusive lower bound](https://dictionary.cambridge.org/us/dictionary/japanese-english/以上).
- [受付: reception](https://dictionary.cambridge.org/us/dictionary/japanese-english/受け付け-受付).
- [叱る: to scold](https://dictionary.cambridge.org/us/dictionary/japanese-english/叱る), not 然る, “a certain”.
- [届ける: to deliver or notify](https://dictionary.cambridge.org/dictionary/japanese-english/届ける).
- [看護師: nurse](https://dictionary.cambridge.org/dictionary/japanese-english/看護師).

`jmdictId` is omitted for the corrected soap card because the source links its kana headword to the wrong homophone. Supplementary cards do not invent dictionary identifiers. The spelling changes, gloss corrections, and additions are local adaptations and are not presented as changes made by the upstream maintainers.

## Example sentences

`examples.json` provides one Japanese sentence and English translation for all 1,572 cards. It records the source commit and original Tatoeba Japanese sentence ID for corpus examples. Original learner sentences fill source gaps and clarify selected homographs or corrected meanings; these have `source: "local"` and are released under CC BY-SA 4.0. They do not carry invented Tatoeba IDs.

Examples for kanji reuse a sentence containing that character, preferably from a vocabulary headword containing it. Short corpus examples are preferred. Sentences are not graded JLPT grammar exercises; a sentence can contain grammar or vocabulary above its card’s assigned level. The app displays examples only after an answer is revealed or a quiz choice is made.
