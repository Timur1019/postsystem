/**
 * TSPL-команды для XP-365B и аналогов (этикетки / ценники).
 */
const iconv = require('iconv-lite');
const { fmtMoney } = require('../cashier-receipt-escpos/escpos-format.cjs');
const {
  wrapTextLines,
  maxCharsForPaper,
} = require('../cashier-receipt-escpos/escpos-label-layout.cjs');

/** 203 dpi — XP-365B и большинство 58-мм принтеров. */
const DOTS_PER_MM = 8;

function mmToDots(mm) {
  return Math.round(Number(mm) * DOTS_PER_MM);
}

function escapeTsplText(text) {
  return String(text || '').replace(/"/g, "'");
}

/**
 * @param {object} payload
 */
function validateTsplLabelPayload(payload) {
  const items = payload?.labels;
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Нет этикеток для печати');
  }
  const needBarcode = items.some((item) => item.showBarcode);
  if (needBarcode && !items.some((item) => String(item.barcode || '').trim())) {
    throw new Error('Не указан штрихкод для печати');
  }
  const w = Number(payload.paperWmm);
  const h = Number(payload.paperHmm);
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) {
    throw new Error('Некорректный размер этикетки');
  }
}

/**
 * @param {object} item
 * @param {object} payload
 * @param {number} ox
 * @param {number} oy
 * @param {boolean} compact
 * @param {number} fontScale
 * @returns {string[]}
 */
function buildItemCommands(item, payload, ox, oy, compact, fontScale) {
  const lines = [];
  const isPriceTag = item.variant === 'priceTag';
  const hasPrice = item.price != null && !Number.isNaN(Number(item.price));
  const cur = item.currency || payload.labelsMeta?.currency || 'sum';
  const paperWmm = Number(payload.paperWmm) || 58;
  const paperHmm = Number(payload.paperHmm) || 40;

  let y = oy + mmToDots(compact ? 1 : 2);
  const priceMul = compact ? 1 : fontScale >= 1.2 ? 2 : 1;
  const nameFont = compact ? '2' : '3';
  const nameMul = fontScale >= 1.3 ? 2 : 1;

  if (isPriceTag && item.showPrice && hasPrice) {
    const priceText = `${fmtMoney(item.price)} ${cur}`;
    lines.push(
      `TEXT ${ox + mmToDots(2)},${y},"4",0,${priceMul},${priceMul},"${escapeTsplText(priceText)}"`,
    );
    y += mmToDots(compact ? 5 : 8);
  }

  if (item.showName && item.productName) {
    const maxLines = isPriceTag ? (compact ? 2 : 3) : 4;
    const wrapped = wrapTextLines(item.productName, maxCharsForPaper(paperWmm)).slice(0, maxLines);
    const lineStep = mmToDots(compact ? 3 : 4) * nameMul;
    for (const line of wrapped) {
      lines.push(
        `TEXT ${ox + mmToDots(2)},${y},"${nameFont}",0,${nameMul},${nameMul},"${escapeTsplText(line)}"`,
      );
      y += lineStep;
    }
  }

  if (!isPriceTag && item.showPrice && hasPrice) {
    y += mmToDots(1);
    const priceText = `${fmtMoney(item.price)} ${cur}`;
    lines.push(`TEXT ${ox + mmToDots(2)},${y},"3",0,1,1,"${escapeTsplText(priceText)}"`);
    y += mmToDots(4);
  }

  if (item.showBarcode && item.barcode) {
    const code = String(item.barcode).replace(/\s/g, '');
    if (code) {
      const bcH = compact ? 34 : paperHmm <= 35 ? 46 : 52;
      const bcNarrow = compact ? 1 : 2;
      const bcWide = compact ? 2 : 3;
      y += mmToDots(compact ? 0.5 : 1);
      lines.push(
        `BARCODE ${ox + mmToDots(2)},${y},"128",${bcH},1,0,${bcNarrow},${bcWide},"${escapeTsplText(code)}"`,
      );
    }
  }

  return lines;
}

/**
 * @param {object} payload
 * @returns {Buffer}
 */
function buildTsplBuffer(payload) {
  validateTsplLabelPayload(payload);

  const paperWmm = Number(payload.paperWmm) || 58;
  const paperHmm = Number(payload.paperHmm) || 40;
  const padX = Number(payload.padXmm) || 0;
  const padY = Number(payload.padYmm) || 0;
  const offX = Number(payload.offsetXmm) || 0;
  const offY = Number(payload.offsetYmm) || 0;
  const gapMm = Number(payload.gapMm) || 2;
  const rotate180 = Boolean(payload.rotate180);
  const fontScale = Number(payload.fontScale) || 1;
  const copies = Math.min(999, Math.max(1, Number(payload.copies) || 1));
  const compact = paperHmm <= 28 || paperWmm <= 35;

  const ox = mmToDots(padX + offX);
  const oy = mmToDots(padY + offY);

  const header = [
    `SIZE ${paperWmm} mm,${paperHmm} mm`,
    `GAP ${gapMm} mm,0 mm`,
    `DIRECTION ${rotate180 ? 0 : 1}`,
    'REFERENCE 0,0',
    'CODEPAGE 1251',
    'CLS',
  ];

  const body = [];
  for (const item of payload.labels) {
    body.push(...buildItemCommands(item, payload, ox, oy, compact, fontScale));
  }

  const tspl = [...header, ...body, `PRINT ${copies}`, ''].join('\r\n');
  return iconv.encode(tspl, 'win1251');
}

module.exports = {
  DOTS_PER_MM,
  mmToDots,
  validateTsplLabelPayload,
  buildTsplBuffer,
};
