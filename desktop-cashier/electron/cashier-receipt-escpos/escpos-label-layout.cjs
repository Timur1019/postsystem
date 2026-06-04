/**
 * Вёрстка текста и штрихкода для этикеток ESC/POS.
 */

/**
 * @param {number} paperWmm
 */
function maxCharsForPaper(paperWmm) {
  const w = Number(paperWmm) || 58;
  if (w <= 32) return 14;
  if (w <= 38) return 18;
  if (w <= 45) return 22;
  return 28;
}

/**
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function wrapTextLines(text, maxChars) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const max = Math.max(8, maxChars);
  const words = raw.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';

  const pushLongWord = (word) => {
    for (let i = 0; i < word.length; i += max) {
      lines.push(word.slice(i, i + max));
    }
  };

  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (next.length <= max) {
      cur = next;
      continue;
    }
    if (cur) lines.push(cur);
    if (word.length > max) {
      pushLongWord(word);
      cur = '';
    } else {
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * @param {number} paperWmm
 * @param {number} paperHmm
 */
function barcodeOptsForPaper(paperWmm, paperHmm) {
  const w = Number(paperWmm) || 40;
  const h = Number(paperHmm) || 30;
  if (h <= 22 || w <= 32) {
    return { width: 1, height: 34 };
  }
  if (h <= 28) {
    return { width: 1.25, height: 40 };
  }
  if (h <= 35) {
    return { width: 1.5, height: 46 };
  }
  return { width: 2, height: 52 };
}

/**
 * @param {import('node-thermal-printer').printer} printer
 * @param {string} text
 * @param {number} paperWmm
 * @param {number} [maxLines]
 */
function printWrappedCenter(printer, text, paperWmm, maxLines = 3) {
  const lines = wrapTextLines(text, maxCharsForPaper(paperWmm)).slice(0, maxLines);
  printer.alignCenter();
  for (const line of lines) {
    printer.println(line);
  }
  printer.alignLeft();
}

module.exports = {
  maxCharsForPaper,
  wrapTextLines,
  barcodeOptsForPaper,
  printWrappedCenter,
};
