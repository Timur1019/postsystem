/**
 * ESC/POS для Xprinter POS-80 и совместимых (Epson-эмуляция).
 * Тихая печать через драйвер Windows: printer:<имя из системы>.
 */

const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');
const { IS_WIN, printRawBuffer } = require('./win-raw-print.cjs');

/** 80 mm, шрифт A — обычно 48 символов. */
const LINE_WIDTH = 48;

function isThermalPrinterName(name) {
  return /xprinter|xp[- ]?80|xp[- ]?58|pos[- ]?80|pos80|thermal|termo|чек|receipt|escpos/i.test(
    String(name || '')
  );
}

function fieldOn(fields, key) {
  if (!fields || typeof fields !== 'object') return true;
  return fields[key] !== false;
}

function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function fmtQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
}

function splitDateTime(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}

function buildFiscalSign(sale) {
  const base = `${sale.receiptNumber}|${sale.id}|${sale.totalAmount}|${sale.createdAt}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, '0');
}

function shiftNoFromSale(sale) {
  return (
    String(sale.shiftNo || '')
      .replace(/\D/g, '')
      .slice(-3)
      .padStart(3, '0') ||
    String(sale.receiptNumber || '')
      .replace(/\D/g, '')
      .slice(-3)
      .padStart(3, '0') ||
    '001'
  );
}

function sanitizeLine(text) {
  return String(text ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .trim();
}

function padColumns(left, right, width = LINE_WIDTH) {
  const l = sanitizeLine(left);
  const r = sanitizeLine(right);
  const gap = Math.max(1, width - l.length - r.length);
  if (l.length + r.length >= width) {
    return `${l.slice(0, width - r.length - 1)} ${r}`;
  }
  return `${l}${' '.repeat(gap)}${r}`;
}

function wrapLines(text, width = LINE_WIDTH) {
  const words = sanitizeLine(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= width) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w.length > width ? w.slice(0, width) : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paymentLabel(method, labels) {
  const map = {
    CASH: labels.paymentCash || 'Cash',
    CARD: labels.paymentCard || 'Card',
    MPESA: labels.paymentMpesa || 'Mpesa',
    MIXED: labels.paymentMixed || 'Mixed',
  };
  return map[method] || method || '—';
}

function vatRateLabel(sale) {
  const rates = new Set(
    (sale.items || [])
      .map((i) => (i.taxRatePercent != null ? Number(i.taxRatePercent) : 12))
      .filter((r) => r > 0)
  );
  if (rates.size === 1) return `${[...rates][0].toFixed(0)}`;
  return '12';
}

function assertDeviceName(deviceName) {
  const name = String(deviceName || '').trim();
  if (!name) {
    throw new Error('Принтер чека не выбран (меню Aurent → Принтер чека).');
  }
  if (!IS_WIN) {
    throw new Error('ESC/POS RAW — только Windows');
  }
  return name;
}

/** Собирает ESC/POS в буфер (без interface — драйвер printer npm не нужен). */
function createEscPosBufferPrinter() {
  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    characterSet: CharacterSet.PC866_CYRILLIC,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    breakLine: BreakLine.WORD,
    width: LINE_WIDTH,
  });
  printer.append(printer.printer.config.HW_INIT);
  return printer;
}

async function sendEscPosBuffer(deviceName, printer) {
  const buffer = printer.buffer;
  if (!buffer || buffer.length < 16) {
    throw new Error('Буфер чека пустой');
  }
  await printRawBuffer(deviceName, buffer);
}

/**
 * @param {object} sale
 * @param {{ deviceName: string, labels?: object, fields?: object, branding?: object, qrPayload?: string }} options
 */
async function printSaleEscPos(sale, options = {}) {
  const { labels = {}, fields = {}, branding = {} } = options;
  const deviceName = assertDeviceName(options.deviceName);
  const printer = createEscPosBufferPrinter();
  const L = labels;
  const cur = L.currency || "so'm";
  const { date, time } = splitDateTime(sale.createdAt);
  const fiscalSign = buildFiscalSign(sale);
  const shift = shiftNoFromSale(sale);
  const method = sale.paymentMethod;
  const total = Number(sale.totalAmount) || 0;
  const cashAmt =
    method === 'CASH'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cashAmount) || 0
        : 0;
  const cardAmt =
    method === 'CARD'
      ? Number(sale.amountTendered) || total
      : method === 'MIXED'
        ? Number(sale.cardAmount) || 0
        : 0;
  const paidTotal =
    method === 'MIXED' ? cashAmt + cardAmt : method === 'CASH' ? Number(sale.amountTendered) || total : total;
  const change = Number(sale.changeGiven) || 0;
  const vatRate = vatRateLabel(sale);

  const divider = () => {
    printer.println('-'.repeat(LINE_WIDTH));
  };

  if (fieldOn(fields, 'companyName')) {
    printer.alignCenter();
    printer.bold(true);
    printer.println(sanitizeLine(branding.companyName || sale.storeName || 'AURENT'));
    printer.bold(false);
  }
  if (fieldOn(fields, 'companyAddress') && branding.companyAddress) {
    printer.alignCenter();
    for (const line of String(branding.companyAddress).split('\n')) {
      if (line.trim()) printer.println(sanitizeLine(line));
    }
  }
  if (fieldOn(fields, 'stir') && branding.stir) {
    printer.alignCenter();
    printer.println(`${L.stir || 'STIR'}: ${sanitizeLine(branding.stir)}`);
  }

  printer.alignLeft();
  if (fieldOn(fields, 'dateTime')) {
    printer.println(padColumns(`${L.date || 'Sana'}: ${date}`, `${L.time || 'Vaqt'}: ${time}`));
  }
  if (fieldOn(fields, 'receiptNo')) {
    printer.println(`${L.receiptNoShort || 'Chek'}: №${sanitizeLine(sale.receiptNumber)}`);
  }
  if (fieldOn(fields, 'employee') && sale.cashierName) {
    for (const line of wrapLines(`${L.employee || 'Xodim'}: ${sale.cashierName}`)) {
      printer.println(line);
    }
  }
  if (fieldOn(fields, 'shift')) {
    printer.println(`${L.shift || 'Smena'}: ${shift}`);
  }

  if (fieldOn(fields, 'items')) {
    divider();
    printer.bold(true);
    printer.println(
      padColumns(L.item || 'Mahsulot', `${L.qtyShort || 'Soni'}  ${L.lineTotalShort || 'Jami'}`)
    );
    printer.bold(false);
    for (const item of sale.items || []) {
      for (const line of wrapLines(item.productName || '')) {
        printer.println(line);
      }
      printer.println(
        padColumns('', `${fmtQty(item.quantity)}  ${fmtMoney(item.lineTotal)}`)
      );
    }
  }

  if (fieldOn(fields, 'discounts') || fieldOn(fields, 'grandTotal') || fieldOn(fields, 'vatTotal')) {
    divider();
    if (fieldOn(fields, 'discounts') && Number(sale.discountTotal) > 0) {
      printer.println(
        padColumns(L.discountsSum || 'Chegirma', `${fmtMoney(sale.discountTotal)} ${cur}`)
      );
    }
    if (fieldOn(fields, 'grandTotal')) {
      printer.bold(true);
      printer.println(padColumns(L.grandTotal || 'Jami', `${fmtMoney(sale.totalAmount)} ${cur}`));
      printer.bold(false);
    }
    if (fieldOn(fields, 'vatTotal')) {
      const vatLabel =
        typeof L.vatTotalLine === 'string' && L.vatTotalLine.includes('{{')
          ? L.vatTotalLine.replace('{{rate}}', vatRate)
          : `QQS ${vatRate}%`;
      printer.println(padColumns(vatLabel, `${fmtMoney(sale.taxTotal)} ${cur}`));
    }
  }

  if (fieldOn(fields, 'payment')) {
    divider();
    printer.println(padColumns(L.paymentForm || "To'lov", `${fmtMoney(paidTotal)} ${cur}`));
    if (cashAmt > 0) {
      printer.println(padColumns(L.cash || 'Naqd', `${fmtMoney(cashAmt)} ${cur}`));
    }
    if (cardAmt > 0) {
      printer.println(padColumns(L.plastic || 'Plastik', `${fmtMoney(cardAmt)} ${cur}`));
    }
    if (method !== 'CASH' && method !== 'MIXED' && cardAmt === 0 && cashAmt === 0) {
      printer.println(padColumns(paymentLabel(method, L), `${fmtMoney(total)} ${cur}`));
    }
    if (change > 0) {
      printer.bold(true);
      printer.println(padColumns(L.change || 'Qaytim', `${fmtMoney(change)} ${cur}`));
      printer.bold(false);
    }
  }

  if (fieldOn(fields, 'fiscalBlock')) {
    divider();
    printer.bold(true);
    printer.println(L.fiscalSection || 'Fiskal');
    printer.bold(false);
    printer.println(padColumns(L.fmNumber || 'FM', sanitizeLine(sale.receiptNumber)));
    printer.println(padColumns(L.fiscalSign || 'Belgi', fiscalSign));
  }

  const qrPayload = options.qrPayload || sale.qrPayload || '';
  if (fieldOn(fields, 'qrCode') && qrPayload) {
    printer.alignCenter();
    try {
      printer.printQR(qrPayload, {
        cellSize: 5,
        correction: 'M',
        model: 2,
      });
    } catch (err) {
      console.warn('[Aurent ESC/POS] QR skipped:', err?.message || err);
    }
  }

  if (fieldOn(fields, 'footer')) {
    printer.alignCenter();
    printer.println(L.footer || 'Rahmat!');
  }

  printer.newLine();
  printer.newLine();
  printer.cut();
  await sendEscPosBuffer(deviceName, printer);

  return { mode: 'escpos', deviceName };
}

async function printTestEscPos(deviceName) {
  const name = assertDeviceName(deviceName);
  const printer = createEscPosBufferPrinter();
  printer.alignCenter();
  printer.bold(true);
  printer.println('AURENT — TEST');
  printer.bold(false);
  printer.alignLeft();
  printer.println('Xprinter POS-80 / ESC/POS');
  printer.println(padColumns('Sana', new Date().toLocaleString('ru-RU')));
  printer.println('Agar bu matn chop etilsa —');
  printer.println('avtoprint ishlayapti.');
  printer.newLine();
  printer.cut();
  await sendEscPosBuffer(name, printer);
  return { mode: 'escpos', deviceName: name };
}

module.exports = {
  LINE_WIDTH,
  IS_WIN,
  isThermalPrinterName,
  printSaleEscPos,
  printTestEscPos,
  createEscPosBufferPrinter,
  sendEscPosBuffer,
};
