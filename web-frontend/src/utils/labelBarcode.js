const digitsOnly = (v) => String(v || '').replace(/\D/g, '');

/**
 * Штрихкод для печати этикетки из карточки каталога.
 * Приоритет: основной → дополнительные → артикул → код упаковки → цифры запроса (≥8).
 */
export function resolveLabelBarcodeFromProduct(data, searchQuery = '') {
  const main = data?.barcode && String(data.barcode).trim();
  if (main) return main;

  if (Array.isArray(data?.barcodes)) {
    const extra = data.barcodes.find((b) => String(b || '').trim());
    if (extra) return String(extra).trim();
  }

  const sku = data?.sku && String(data.sku).trim();
  if (sku) return sku;

  const packageCode = data?.packageCode && String(data.packageCode).trim();
  if (packageCode) return packageCode;

  const q = digitsOnly(searchQuery);
  if (q.length >= 8) return q;

  return '';
}

/**
 * Штрихкод для печати из позиции Tasnif (с учётом выбранной упаковки / единицы).
 */
export function resolveLabelBarcodeFromTasnif(item, searchQuery = '', pkg = null) {
  const fromApi = item?.barcode || item?.internalCode;
  if (fromApi && String(fromApi).trim()) {
    return String(fromApi).trim();
  }

  const pkgCode = pkg?.code && String(pkg.code).trim();
  if (pkgCode) return pkgCode;

  const mxik = item?.mxik && String(item.mxik).trim();
  const q = digitsOnly(searchQuery);
  if (q.length >= 8) return q;

  if (mxik) return mxik;

  return '';
}

export { digitsOnly };
