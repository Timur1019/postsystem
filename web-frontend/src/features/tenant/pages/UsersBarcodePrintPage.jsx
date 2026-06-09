import {
  LabelPrintLayoutProvider,
  ShelfLabelPrintSettingsPanel,
  useLabelPrintLayoutSettings,
} from '../../../shelfLabelPrint';
import BarcodePrintPageHeader from '../components/barcode-print/BarcodePrintPageHeader';
import BarcodePrintSearchSection from '../components/barcode-print/BarcodePrintSearchSection';
import BarcodePrintCurrentItemSection from '../components/barcode-print/BarcodePrintCurrentItemSection';
import BarcodePrintModals from '../components/barcode-print/BarcodePrintModals';
import { useUsersBarcodePrintPage } from '../hooks/useUsersBarcodePrintPage';
import '../../../styles/shared/tasnif-search.css';
import '../../../styles/tenant/users-barcode-print.css';

function UsersBarcodePrintPageContent() {
  const layoutSettings = useLabelPrintLayoutSettings();
  const {
    t,
    lang,
    searchRef,
    query,
    setQuery,
    loading,
    draft,
    priceInput,
    setPriceInput,
    catalogResults,
    tasnifResults,
    packageItem,
    printOpen,
    previewPrice,
    runLookup,
    pickTasnifItem,
    handleCatalogPick,
    handlePackageSelect,
    handlePackageClose,
    handleOpenPrint,
    handleClosePrint,
  } = useUsersBarcodePrintPage();

  return (
    <div className="barcode-print-page">
      <BarcodePrintPageHeader t={t} />

      <div className="barcode-print-page__grid">
        <aside className="barcode-print-page__settings">
          <ShelfLabelPrintSettingsPanel
            t={t}
            layout={layoutSettings.layout}
            patchLayout={layoutSettings.patchLayout}
            maxPadXmm={layoutSettings.maxPadXmm}
            maxPadYmm={layoutSettings.maxPadYmm}
            applyPreset={layoutSettings.applyPreset}
            resetPresetDefaults={layoutSettings.resetPresetDefaults}
            sidebar
          />
        </aside>

        <div className="barcode-print-page__workspace">
          <BarcodePrintSearchSection
            t={t}
            searchRef={searchRef}
            query={query}
            onQueryChange={setQuery}
            onLookup={runLookup}
            loading={loading}
            catalogResults={catalogResults}
            tasnifResults={tasnifResults}
            onCatalogPick={handleCatalogPick}
            onTasnifPick={pickTasnifItem}
          />

          <BarcodePrintCurrentItemSection
            t={t}
            draft={draft}
            priceInput={priceInput}
            onPriceChange={setPriceInput}
            onOpenPrint={handleOpenPrint}
          />
        </div>
      </div>

      <BarcodePrintModals
        packageItem={packageItem}
        lang={lang}
        onPackageSelect={handlePackageSelect}
        onPackageClose={handlePackageClose}
        printOpen={printOpen}
        draft={draft}
        previewPrice={previewPrice}
        onClosePrint={handleClosePrint}
      />
    </div>
  );
}

export default function UsersBarcodePrintPage() {
  return (
    <LabelPrintLayoutProvider>
      <UsersBarcodePrintPageContent />
    </LabelPrintLayoutProvider>
  );
}
