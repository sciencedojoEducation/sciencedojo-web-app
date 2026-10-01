import { germanA1VocabularySheets } from "./german-a1-vocabulary-sheet-bounds.ts";

/** Recover the whole illustration from its sheet instead of using the old fixed-grid crop. */
export function germanA1VocabularyImage(src?: string) {
  const match = src?.match(/^\/images\/academy\/german-a1\/word-cards\/chapter-(\d{2})-(\d{2})\.jpg$/);
  if (!match) return null;
  const sheet = germanA1VocabularySheets.find((item) => item.chapter === Number(match[1]));
  const index = Number(match[2]) - 1;
  if (!sheet || index < 0 || index >= 25) return null;
  const [left, right] = sheet.columns[index % 5];
  const [top, bottom] = sheet.rows[Math.floor(index / 5)];
  return {
    src: `/images/academy/german-a1/wortschatz/chapter-${match[1]}.jpg`,
    sheetWidth: sheet.width,
    sheetHeight: sheet.height,
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
}
