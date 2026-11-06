# Content audit, 6 November 2026

## Result

The old decks were incomplete. They mixed characters and words, duplicated characters across levels, and included a few misleading readings or translations. The app now covers the pinned OpenJLPT N5/N4 baseline with documented local corrections and useful retained vocabulary.

| Deck           |                             Before |                   After |
| -------------- | ---------------------------------: | ----------------------: |
| N5 kanji       |  92 records, including 8 compounds |           84 characters |
| N4 kanji       |                        167 records |          169 characters |
| Combined kanji | 230 distinct individual characters | 253 distinct characters |
| N5 vocabulary  |                           99 cards |               681 cards |
| N4 vocabulary  |                          128 cards |               638 cards |

The smaller N5 headline count reflects removal of words and consistent level assignment, not reduced overall character coverage.

## Character corrections

Eight compounds belonged in vocabulary: 先週, 月曜日, 火曜日, 水曜日, 木曜日, 金曜日, 土曜日, 日曜日. Their readings now describe the complete words. Previously, weekday compounds incorrectly carried the readings of only the first character.

Twenty-one characters appeared in both levels. Each now appears once at its reference level. 無 also moves from the old N4 list to the reference N5 list. Historical browser progress follows these moves.

The 23 previously missing characters across the two levels were:

国 人 出 間 東 入 高 山 北 名 川 西 南 万 白 母 父 丈 誰 貼 坊 凄 痩

Examples of corrected readings include 早: サッ rather than さ, and removal of きます as if it were an isolated kun'yomi of 来. Kanji entries now retain the reference's complete dictionary reading fields and standard okurigana notation.

## Vocabulary corrections and expansion

The original lists only sampled the start of the alphabetic/kana ordering, with some extra loanwords and adverbs. All 1,304 reference cards are now included, plus 15 supplementary cards. Existing correct words and spellings are retained as cards or searchable variants.

Local corrections address errors in both the old app and the imported baseline. Examples:

| Item         | Corrected teaching point                                 |
| ------------ | -------------------------------------------------------- |
| 早い / 速い  | Early versus fast                                        |
| 以下 / 以上  | Both include the stated number                           |
| 一日         | いちにち: one day; ついたち: first day of the month      |
| せっけん     | Soap, not economy                                        |
| 半分         | Half, not half a minute                                  |
| ガス         | Gas, not gasoline                                        |
| ごちそうさま | Thanks after a meal, not the noun feast                  |
| しかる       | To scold; do not link to the homophone 然る              |
| 受付         | Reception/registration, rather than just receipt         |
| 届ける       | To deliver/notify, rather than the intransitive to reach |
| けがする     | To get injured                                           |
| 君 / ちゃん  | Their use is not restricted to one gender                |

Part-of-speech labels are based on source dictionary codes. Noun filtering no longer includes pronouns just because the English label contains the substring “noun”.

## Application safeguards

- Stable card IDs preserve different readings of the same spelling in combined decks.
- Legacy aliases preserve the 486 former card records when a spelling, kind, or level changes. Former duplicates reuse the most recently studied history rather than double-counting it.
- Homophones such as はし and 橋 are not offered as wrong choices for the same reading prompt.
- Bare reading questions are skipped when a displayed word has distinct readings in the deck.
- Progress summaries and session ordering read browser storage once per deck operation, avoiding repeated parsing for the larger lists.
- All select arrows are positioned 14 pixels from the right border, with space reserved for the label.
- The back-to-top arrow appears after scrolling 320 pixels, independently of scroll direction, and is removed from keyboard navigation while hidden.

## Verification limits

The baseline is community guidance, not an official exhaustive JLPT syllabus. Readings are dictionary readings and include some uncommon forms. Structural and reference checks cover the entire dataset; targeted semantic corrections do not constitute a guarantee that every possible sense is exhaustive or that no further dictionary error can exist.

See [data/README.md](../data/README.md) for source provenance, licence, correction references, and regeneration instructions.
