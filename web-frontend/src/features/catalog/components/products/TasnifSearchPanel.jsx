import TasnifPackagePickerModal from '../../../../components/tasnif/TasnifPackagePickerModal';
import { useTasnifSearchPanel } from '../../hooks/useTasnifSearchPanel';
import TasnifSearchInput from './tasnif/TasnifSearchInput';
import TasnifSearchResultsList from './tasnif/TasnifSearchResultsList';
import '../../../../styles/shared/tasnif-search.css';

export default function TasnifSearchPanel({ setValue, getValues, isEdit }) {
  const p = useTasnifSearchPanel({ setValue, getValues, isEdit });

  return (
    <>
      <section className="tasnif-search">
        <TasnifSearchInput
          t={p.t}
          query={p.query}
          onQueryChange={p.setQuery}
          onSearch={p.runSearch}
          loading={p.loading}
        />
        <TasnifSearchResultsList t={p.t} results={p.results} onPick={p.pickItem} />
      </section>

      <TasnifPackagePickerModal
        open={!!p.packageItem}
        item={p.packageItem}
        lang={p.lang}
        onSelect={p.handlePackageSelect}
        onClose={p.handlePackageClose}
      />
    </>
  );
}
