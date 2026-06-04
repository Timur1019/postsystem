import { LayoutGrid, List } from 'lucide-react';

export default function CashierSalesViewToggle({ viewMode, onChange, t }) {
  return (
    <div className="pos-topbar-views cashier-sales-view-toggle" role="group" aria-label={t('pos.viewModeLabel')}>
      <button
        type="button"
        className={`pos-topbar-views__btn${viewMode === 'list' ? ' is-active' : ''}`}
        onClick={() => onChange('list')}
        title={t('pos.viewAsList')}
      >
        <List size={18} aria-hidden />
      </button>
      <button
        type="button"
        className={`pos-topbar-views__btn${viewMode === 'cards' ? ' is-active' : ''}`}
        onClick={() => onChange('cards')}
        title={t('pos.viewAsCards')}
      >
        <LayoutGrid size={18} aria-hidden />
      </button>
    </div>
  );
}
