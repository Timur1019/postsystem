import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export default function CategoryRowMenu({ rowMenu, onClose, onEdit, onDelete }) {
  const { t } = useTranslation();
  if (!rowMenu) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[80] cursor-default"
        aria-label="close menu"
        onClick={onClose}
      />
      <div
        role="menu"
        className="fixed z-[90] min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-800"
        style={{
          top: `${rowMenu.rect.bottom + 4}px`,
          right: `${window.innerWidth - rowMenu.rect.right}px`,
        }}
      >
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => onEdit(rowMenu.category)}
        >
          {t('categories.rowEdit')}
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
          onClick={() => onDelete(rowMenu.category)}
        >
          {t('categories.rowDelete')}
        </button>
      </div>
    </>,
    document.body
  );
}
