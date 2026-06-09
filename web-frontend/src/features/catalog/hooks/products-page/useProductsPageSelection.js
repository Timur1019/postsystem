import { useEffect, useMemo, useRef, useState } from 'react';

export function useProductsPageSelection({ pageContent, page, search }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const selectAllRef = useRef(null);

  const pageIds = useMemo(() => pageContent.map((p) => p.id), [pageContent]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  useEffect(() => {
    if (!rowMenu) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rowMenu]);

  useEffect(() => {
    setRowMenu(null);
  }, [page, search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => n.delete(id));
      } else {
        pageIds.forEach((id) => n.add(id));
      }
      return n;
    });
  };

  return {
    selectedIds,
    setSelectedIds,
    rowMenu,
    setRowMenu,
    selectAllRef,
    allPageSelected,
    somePageSelected,
    toggleSelect,
    toggleSelectAllPage,
  };
}
