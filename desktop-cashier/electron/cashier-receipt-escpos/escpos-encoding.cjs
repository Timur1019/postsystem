/**
 * Кодировка ESC/POS по языку кассы (ru / uz с фронта).
 * Xprinter/POS-80: выход из китайского двухбайтового режима перед печатью.
 */
const { CharacterSet } = require('node-thermal-printer');

/** FS . — отмена китайского (GBK) режима на многих Xprinter. */
const EXIT_CHINESE_MODE = Buffer.from([0x1c, 0x2e]);

const APOSTROPHE_LIKE = /[\u02BB\u02BC\u2018\u2019\u02BF\u0060]/g;

/**
 * @param {string|undefined} raw — i18n.language: ru, uz, ru-RU…
 * @returns {'ru'|'uz'}
 */
function normalizeLocale(raw) {
  const lang = String(raw || 'ru').toLowerCase().split('-')[0];
  return lang === 'uz' ? 'uz' : 'ru';
}

/**
 * Таблица символов принтера по языку интерфейса.
 * ru → PC866 (стабильнее WPC1251 на POS-80 / Xprinter).
 * uz → WPC1252 (латиница узбекского алфавита).
 * @param {'ru'|'uz'} locale
 */
function resolveCharacterSet(locale) {
  if (locale === 'uz') {
    return CharacterSet.WPC1252;
  }
  return CharacterSet.PC866_CYRILLIC2;
}

/**
 * Нормализует строку под выбранную code page принтера.
 * @param {unknown} text
 * @param {'ru'|'uz'} locale
 */
function normalizePrintText(text, locale) {
  if (text == null) return '';
  let s = String(text);
  if (locale === 'uz') {
    s = s
      .replace(APOSTROPHE_LIKE, "'")
      .replace(/\u2013|\u2014/g, '-')
      .replace(/\u2026/g, '...');
  }
  return s;
}

/**
 * @param {unknown} value
 * @param {'ru'|'uz'} locale
 */
function sanitizeValue(value, locale) {
  if (typeof value === 'string') {
    return normalizePrintText(value, locale);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, locale));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = sanitizeValue(nested, locale);
    }
    return out;
  }
  return value;
}

/**
 * Подготавливает payload: locale + безопасные строки для принтера.
 * @param {object} payload
 */
function sanitizePayloadForPrint(payload) {
  const locale = normalizeLocale(payload?.locale);
  return {
    ...payload,
    locale,
    sale: sanitizeValue(payload?.sale, locale),
    branding: sanitizeValue(payload?.branding, locale),
    labels: sanitizeValue(payload?.labels, locale),
    receiptFields: payload?.receiptFields,
  };
}

/**
 * Команды в начале чека после clear().
 * @param {import('node-thermal-printer').printer} printer
 */
function preparePrinterEncoding(printer) {
  printer.append(EXIT_CHINESE_MODE);
}

module.exports = {
  normalizeLocale,
  resolveCharacterSet,
  normalizePrintText,
  sanitizePayloadForPrint,
  preparePrinterEncoding,
  EXIT_CHINESE_MODE,
};
