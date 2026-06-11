import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productApi } from '../../api';

const DEBOUNCE_MS = 300;

export function useProductLookupSelect({
  value,
  storeId,
  minSearchLength = 2,
  pageSize = 20,
  disabled = false,
  onBlur,
  name,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const selectedQuery = useQuery({
    queryKey: ['product-lookup-selected', value, storeId],
    queryFn: () =>
      productApi
        .getById(value, storeId != null && storeId !== '' ? { storeId } : undefined)
        .then((r) => r.data),
    enabled: !!value,
  });

  const searchQuery = useQuery({
    queryKey: ['product-lookup-search', debouncedQuery, storeId],
    queryFn: () =>
      productApi
        .getAll({
          search: debouncedQuery,
          page: 0,
          size: pageSize,
          activeOnly: true,
          ...(storeId != null && storeId !== '' ? { storeId } : {}),
        })
        .then((r) => r.data),
    enabled: open && debouncedQuery.length >= minSearchLength,
    placeholderData: keepPreviousData,
  });

  const candidates = searchQuery.data?.content ?? [];
  const selectedProduct = selectedQuery.data;
  const searchReady = debouncedQuery.length >= minSearchLength;

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setHighlightIndex(-1);
    onBlur?.({ target: { value: value ?? '', name } });
  }, [name, onBlur, value]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  }, [disabled]);

  useLayoutEffect(() => {
    if (!open || !inputRef.current) return undefined;

    const updatePosition = () => {
      const rect = inputRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (root?.contains(event.target) || menu?.contains(event.target)) return;
      close();
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        inputRef.current?.blur();
        return;
      }

      if (!searchReady || candidates.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : 0));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : candidates.length - 1));
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [candidates.length, close, open, searchReady]);

  useEffect(() => {
    if (open && searchReady) {
      setHighlightIndex(candidates.length > 0 ? 0 : -1);
    }
  }, [candidates, open, searchReady]);

  return {
    listId,
    rootRef,
    inputRef,
    menuRef,
    open,
    openMenu,
    close,
    query,
    setQuery,
    debouncedQuery,
    minSearchLength,
    candidates,
    selectedProduct,
    searchLoading: searchQuery.isFetching,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
  };
}
