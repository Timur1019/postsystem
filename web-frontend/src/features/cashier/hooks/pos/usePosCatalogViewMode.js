import { useCallback, useState } from 'react';
import {
  POS_CATALOG_VIEW_MODE_KEY,
  readPosCatalogViewMode,
} from '../../components/pos/posCatalogConstants';

export function usePosCatalogViewMode() {
  const [viewMode, setViewMode] = useState(readPosCatalogViewMode);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(POS_CATALOG_VIEW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  return { viewMode, handleViewModeChange };
}
