import { useTranslation } from 'react-i18next';
import {
  listTemplatesForBusinessType,
  resolveBusinessTypeForTemplates,
} from '../../../../config/productCatalogTemplateRegistry';
import ProductTemplatePickerHeader from './template-picker/ProductTemplatePickerHeader';
import ProductTemplatePickerStoreBanner from './template-picker/ProductTemplatePickerStoreBanner';
import ProductTemplatePickerGrid from './template-picker/ProductTemplatePickerGrid';
import ProductTemplatePickerAdvancedButton from './template-picker/ProductTemplatePickerAdvancedButton';

export default function ProductTemplatePickerModal({
  selectedStore,
  onClose,
  onBackToStores,
  onSelectTemplate,
  onAdvanced,
}) {
  const { t } = useTranslation();
  const businessType = resolveBusinessTypeForTemplates(selectedStore?.businessType);
  const templates = listTemplatesForBusinessType(businessType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <ProductTemplatePickerHeader t={t} onBackToStores={onBackToStores} onClose={onClose} />

        <div className="space-y-6 p-5">
          <ProductTemplatePickerStoreBanner
            t={t}
            storeName={selectedStore?.name}
            businessType={businessType}
            templateCount={templates.length}
          />
          <ProductTemplatePickerGrid t={t} templates={templates} onSelectTemplate={onSelectTemplate} />
          <ProductTemplatePickerAdvancedButton t={t} onAdvanced={onAdvanced} />
        </div>
      </div>
    </div>
  );
}
