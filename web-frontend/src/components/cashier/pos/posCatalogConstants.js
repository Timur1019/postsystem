export const POS_CATALOG_VIEW_MODE_KEY = 'pos-catalog-view-mode';
export const POS_PRODUCT_PAGE_SIZE = 80;

export function readPosCatalogViewMode() {
  try {
    const v = localStorage.getItem(POS_CATALOG_VIEW_MODE_KEY);
    if (v === 'list' || v === 'grid') return v;
  } catch {
    /* ignore */
  }
  return 'grid';
}
