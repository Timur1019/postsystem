import TasnifSearchPanel from '../TasnifSearchPanel';
import ProductCatalogGeneralSection from './ProductCatalogGeneralSection';
import ProductCatalogAccountingSection from './ProductCatalogAccountingSection';
import ProductCatalogStorePricesSection from './ProductCatalogStorePricesSection';
import ProductCatalogBarcodesSection from './ProductCatalogBarcodesSection';
import ProductCatalogRetailExtrasSection from './ProductCatalogRetailExtrasSection';
import ProductCatalogDynamicFieldsSection from './ProductCatalogDynamicFieldsSection';
import ProductCatalogFiscalSection from './ProductCatalogFiscalSection';
import ProductCatalogStoreContextSection from './ProductCatalogStoreContextSection';

export default function ProductCatalogModalFormBody({
  form,
  categories,
  stores,
  selectedStore,
  onCreateStoreChange,
  templateCode,
  advancedMode,
  onCreateTemplateChange,
}) {
  return (
    <>
      {!form.isEdit && selectedStore && onCreateStoreChange ? (
        <ProductCatalogStoreContextSection
          t={form.t}
          stores={stores}
          selectedStore={selectedStore}
          onStoreChange={onCreateStoreChange}
          universalMode={form.universalMode}
          templateCode={templateCode}
          advancedMode={advancedMode}
          onTemplateChange={onCreateTemplateChange}
        />
      ) : null}

      {form.showSection('tasnif') ? (
        <div className="space-y-4">
          <TasnifSearchPanel setValue={form.setValue} getValues={form.getValues} isEdit={form.isEdit} />
          <ProductCatalogFiscalSection
            t={form.t}
            register={form.register}
            errors={form.errors}
          />
        </div>
      ) : null}

      <ProductCatalogGeneralSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        categories={categories}
        isEdit={form.isEdit}
        saleTypeWatch={form.saleTypeWatch}
        productTypeWatch={form.productTypeWatch}
        template={form.template}
        universalMode={form.universalMode}
        showSection={form.showSection}
      />

      <ProductCatalogAccountingSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        template={form.template}
        showSection={form.showSection}
      />

      {form.showSection('storePrices') ? (
        <ProductCatalogStorePricesSection
          t={form.t}
          stores={stores}
          storeRows={form.storeRows}
          setStoreRows={form.setStoreRows}
          getValues={form.getValues}
          sellingPriceWatch={form.sellingPriceWatch}
        />
      ) : null}

      {form.showSection('clothing') || form.showSection('pharmacy') ? (
        <ProductCatalogRetailExtrasSection
          t={form.t}
          register={form.register}
          errors={form.errors}
          template={form.template}
          showSection={form.showSection}
        />
      ) : null}

      <ProductCatalogDynamicFieldsSection
        t={form.t}
        register={form.register}
        errors={form.errors}
        fields={form.businessConfig?.fields ?? []}
        loading={form.businessConfigLoading}
      />

      {form.showSection('barcodes') ? (
        <ProductCatalogBarcodesSection
          t={form.t}
          register={form.register}
          errors={form.errors}
          extraBarcodes={form.extraBarcodes}
          setExtraBarcodes={form.setExtraBarcodes}
        />
      ) : null}
    </>
  );
}
