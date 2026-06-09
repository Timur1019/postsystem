import { productInfoTabBtn } from '../../../utils/productInfoModalUi';

export default function ProductInfoModalTabBar({ t, tab, productId, onTabChange }) {
  return (
    <div className="flex shrink-0 gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
      <button type="button" className={productInfoTabBtn(tab === 'details')} onClick={() => onTabChange('details')}>
        {t('products.info.tabDetails')}
      </button>
      <button
        type="button"
        className={productInfoTabBtn(tab === 'lifecycle')}
        onClick={() => onTabChange('lifecycle')}
        disabled={!productId}
      >
        {t('products.info.tabLifecycle')}
      </button>
    </div>
  );
}
