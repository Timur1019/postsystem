import { categoryApi, productApi } from '../../api';
import { POS_PRODUCT_PAGE_SIZE } from '../../features/cashier/components/pos/posCatalogConstants';
import { shouldUseLocalPosCatalog } from '../../store/connectivityStore';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import {
  isDesktopOfflineBridge,
  offlineListCategories,
  offlineSearchProducts,
} from './desktopOfflineBridge';
import { POS_CATALOG_ONLINE_TIMEOUT_MS } from './posCatalogConstants';

export function getPosCatalogMode() {
  return shouldUseLocalPosCatalog() ? 'offline' : 'online';
}

function onlineCatalogRequestConfig(signal) {
  return {
    timeout: POS_CATALOG_ONLINE_TIMEOUT_MS,
    ...(signal ? { signal } : {}),
  };
}

export async function fetchPosCategories({ signal } = {}) {
  if (shouldUseLocalPosCatalog()) {
    return offlineListCategories();
  }
  try {
    const res = await categoryApi.getAll(onlineCatalogRequestConfig(signal));
    return res.data;
  } catch (err) {
    if (signal?.aborted) throw err;
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

export async function fetchPosProductsPage({
  storeId,
  categoryId,
  search,
  pageParam,
  signal,
}) {
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
    const res = await productApi.getAll(
      {
        storeId,
        categoryId,
        search: trimmedSearch || undefined,
        page: pageParam,
        size: POS_PRODUCT_PAGE_SIZE,
        activeOnly: true,
      },
      onlineCatalogRequestConfig(signal),
    );
    return res.data;
  } catch (err) {
    if (signal?.aborted) throw err;
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

/** @internal тесты */
export function resolvePosCatalogSource({
  isDesktop,
  offlineAllowed,
  offlineLike,
  bootstrapReady,
  canSellOffline,
  productCount,
}) {
  if (!isDesktop || !offlineAllowed) return 'online';
  if (bootstrapReady || canSellOffline || productCount > 0) return 'offline';
  return offlineLike ? 'offline' : 'online';
}
