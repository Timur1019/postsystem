import { useTranslation } from 'react-i18next';
import { BaseSelect } from '../../../components/ui';

export default function ReportStoreSelect({ stores = [], value, onChange, className }) {
  const { t } = useTranslation();
  return (
    <BaseSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? 'w-auto min-w-[10rem]'}
      placeholder={t('stockReports.allStores')}
      options={[
        { value: '', label: t('stockReports.allStores') },
        ...stores.map((s) => ({ value: String(s.id), label: s.name })),
      ]}
    />
  );
}
