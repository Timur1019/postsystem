import { categoryApi, productApi } from '../../api';
import { POS_PRODUCT_PAGE_SIZE } from '../../features/cashier/components/pos/posCatalogConstants';
import { shouldUseLocalPosCatalog } from '../../store/connectivityStore';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import {
  isDesktopOfflineBridge,
  offlineListCategories,
  offlineSearchProducts,
} from './desktopOfflineBridge';

export function getPosCatalogMode() {
  return shouldUseLocalPosCatalog() ? 'offline' : 'online';
}

export async function fetchPosCategories() {
  if (shouldUseLocalPosCatalog()) {
    return offlineListCategories();
  }
  try {
    const res = await categoryApi.getAll();
    return res.data;
  } catch (err) {
    if (isDesktopOfflineBridge() && isApiUnreachableError(err)) {
      return offlineListCategories();
    }
    throw err;
  }
}

function buildOfflineProductsPage(content, pageParam) {
  const total =
    content.length < POS_PRODUCT_PAGE_SIZE
      ? pageParam + content.length
      : pageParam + content.length + 1;
  return {
    content,
    number: pageParam / POS_PRODUCT_PAGE_SIZE,
    totalPages:
      content.length < POS_PRODUCT_PAGE_SIZE
        ? pageParam / POS_PRODUCT_PAGE_SIZE + 1
        : pageParam / POS_PRODUCT_PAGE_SIZE + 2,
    totalElements: total,
  };
}

export async function fetchPosProductsPage({ storeId, categoryId, search, pageParam }) {
  const trimmedSearch = search?.trim() || '';
  if (shouldUseLocalPosCatalog()) {
    const content = await offlineSearchProducts({
      search: trimmedSearch,
      categoryId,
      limit: POS_PRODUCT_PAGE_SIZE,
      offset: pageParam,
    });
    return buildOfflineProductsPage(content, pageParam);
  }
  try {
    const res = await productApi.getAll({
      storeId,
      categoryId,
      search: trimmedSearch || undefined,
      page: pageParam,
      size: POS_PRODUCT_PAGE_SIZE,
      activeOnly: true,
    });
    return res.data;
  } catch (err) {
    if (isDesktopOfflineBridge() && isApiUnreachableError(err)) {
      const content = await offlineSearchProducts({
        search: trimmedSearch,
        categoryId,
        limit: POS_PRODUCT_PAGE_SIZE,
        offset: pageParam,
      });
      return buildOfflineProductsPage(content, pageParam);
    }
    throw err;
  }
}

export function getPosProductsNextPageParam(lastPage, lastPageParam) {
  const useLocal = shouldUseLocalPosCatalog();
  const next = (lastPage?.number ?? 0) + 1;
  const total = lastPage?.totalPages ?? 0;
  return next < total ? (useLocal ? lastPageParam + POS_PRODUCT_PAGE_SIZE : next) : undefined;
}
