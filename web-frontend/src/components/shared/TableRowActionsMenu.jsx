import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const MENU_WIDTH = 168;
const MENU_ITEM_H = 40;
const GAP = 4;

/**
 * Row kebab menu rendered in a portal so it is not clipped by table overflow.
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, actions: { label: string, onClick: () => void, danger?: boolean }[] }} props
 */
export default function TableRowActionsMenu({ open, onOpenChange, actions }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const positionRef = useRef({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const menuHeight = actions.length * MENU_ITEM_H + 8;
    let top = rect.bottom + GAP;
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - GAP;
    }
    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
    positionRef.current = { top, left };
    if (menuRef.current) {
      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (anchorRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onOpenChange(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        top: positionRef.current.top,
        left: positionRef.current.left,
        width: MENU_WIDTH,
        zIndex: 9999,
      }}
      className="rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-600 dark:bg-slate-800"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          onClick={() => {
            action.onClick();
            onOpenChange(false);
          }}
          className={`block w-full px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
            action.danger ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => onOpenChange(!open)}
        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <MoreVertical size={16} />
      </button>
      {menu && createPortal(menu, document.body)}
    </>
  );
}
