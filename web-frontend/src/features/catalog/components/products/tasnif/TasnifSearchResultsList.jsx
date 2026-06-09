export default function TasnifSearchResultsList({ t, results, onPick }) {
  if (!results.length) return null;

  return (
    <div className="tasnif-search__results">
      {results.map((item) => (
        <button
          key={item.mxik}
          type="button"
          className="tasnif-search__item"
          onClick={() => onPick(item)}
        >
          <div className="tasnif-search__item-name">{item.name}</div>
          <div className="tasnif-search__item-meta">
            {t('productCatalog.ikpu')}: {item.mxik}
            {(item.barcode || item.internalCode)
              ? ` · ${t('productModal.barcode')}: ${item.barcode || item.internalCode}`
              : ''}
            {item.packages?.length
              ? ` · ${t('productCatalog.packagesCount', { count: item.packages.length })}`
              : ''}
          </div>
        </button>
      ))}
    </div>
  );
}
