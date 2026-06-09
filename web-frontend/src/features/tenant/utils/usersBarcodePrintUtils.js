import { productApi } from '../../../api';
import { resolveLabelBarcodeFromProduct } from '../../../utils/labelBarcode';
import { BARCODE_PRINT_CATALOG_SEARCH_SIZE } from '../constants';

export async function loadCatalogProductDetails(data) {
  if (!data?.id) return data;
  try {
    const { data: full } = await productApi.getById(data.id);
    return full ?? data;
  } catch {
    return data;
  }
}

export function buildCatalogResultMeta(product, t) {
  const parts = [];
  if (product.ikpu) parts.push(`${t('productCatalog.ikpu')}: ${product.ikpu}`);
  if (product.sku) parts.push(`${t('products.colSku')}: ${product.sku}`);
  const bc = resolveLabelBarcodeFromProduct(product);
  if (bc) parts.push(`${t('productModal.barcode')}: ${bc}`);
  return parts.join(' · ');
}

export { BARCODE_PRINT_CATALOG_SEARCH_SIZE };
