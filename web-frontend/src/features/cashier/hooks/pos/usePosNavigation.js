import { useCallback, useEffect } from 'react';
import { ALL_CATEGORY_ID } from '../usePosCatalogPanel';
import { usePosShell } from '../../../../contexts/PosShellContext';
import { useCashierCompactLayout } from '../../../../hooks/useCashierCompactLayout';

export function usePosNavigation({
  posPane,
  setPosPane,
  payOpen,
  setPayOpen,
  searchActive,
  viewMode,
  handleViewModeChange,
  catalogBrowse,
  setCatalogBrowse,
  setSelectedCategoryId,
  setSearch,
}) {
  const { setShell } = usePosShell() ?? {};
  const layoutCompact = useCashierCompactLayout();

  useEffect(() => {
    if (payOpen) setPosPane('register');
  }, [payOpen, setPosPane]);

  const handleGoToCatalog = useCallback(() => {
    setPayOpen(false);
    setPosPane('catalog');
    setCatalogBrowse('categories');
    setSelectedCategoryId(ALL_CATEGORY_ID);
    setSearch('');
  }, [setPayOpen, setPosPane, setCatalogBrowse, setSelectedCategoryId, setSearch]);

  const handleClosePayment = useCallback(() => {
    setPayOpen(false);
  }, [setPayOpen]);

  const handleGoToRegister = useCallback(() => {
    setPosPane('register');
    setSearch('');
  }, [setPosPane, setSearch]);

  useEffect(() => {
    if (!setShell) return undefined;
    setShell({
      posPane,
      layoutCompact,
      payOpen,
      catalogBrowse,
      onGoToCatalog: handleGoToCatalog,
      onGoToRegister: handleGoToRegister,
      onClosePayment: handleClosePayment,
      searchActive,
      viewMode,
      onViewModeChange: handleViewModeChange,
    });
    return () => setShell(null);
  }, [
    setShell,
    posPane,
    catalogBrowse,
    handleGoToCatalog,
    handleGoToRegister,
    searchActive,
    viewMode,
    handleViewModeChange,
    layoutCompact,
    payOpen,
    handleClosePayment,
  ]);

  return { handleGoToCatalog, handleClosePayment, handleGoToRegister };
}
