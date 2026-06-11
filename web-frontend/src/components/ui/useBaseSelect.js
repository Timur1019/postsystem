import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

function getEnabledIndexes(options) {
  return options.reduce((acc, option, index) => {
    if (!option.disabled) acc.push(index);
    return acc;
  }, []);
}

export function useBaseSelect({ options, open, setOpen, disabled, onBlur, name, value, onSelectOption }) {
  const listId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 0 });

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
    triggerRef.current?.focus();
    onBlur?.({ target: { value, name } });
  }, [name, onBlur, setOpen, value]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled, setOpen]);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled, setOpen]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
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
        return;
      }

      const enabledIndexes = getEnabledIndexes(options);
      if (enabledIndexes.length === 0) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (highlightIndex >= 0 && !options[highlightIndex]?.disabled) {
          onSelectOption?.(String(options[highlightIndex].value ?? ''));
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightIndex((prev) => {
          if (prev < 0) return enabledIndexes[0];
          const currentPos = enabledIndexes.indexOf(prev);
          const nextPos = currentPos < enabledIndexes.length - 1 ? currentPos + 1 : 0;
          return enabledIndexes[nextPos];
        });
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightIndex((prev) => {
          if (prev < 0) return enabledIndexes[enabledIndexes.length - 1];
          const currentPos = enabledIndexes.indexOf(prev);
          const nextPos = currentPos > 0 ? currentPos - 1 : enabledIndexes.length - 1;
          return enabledIndexes[nextPos];
        });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, highlightIndex, onSelectOption, open, options]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex((option) => String(option.value) === String(value));
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : getEnabledIndexes(options)[0] ?? -1);
  }, [open, options, value]);

  return {
    listId,
    rootRef,
    triggerRef,
    menuRef,
    highlightIndex,
    setHighlightIndex,
    menuStyle,
    openMenu,
    toggle,
    close,
  };
}
