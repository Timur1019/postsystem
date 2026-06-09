import { useTranslation } from 'react-i18next';
import { inputCls } from '../../../components/ui';

export default function ReportStoreSelect({ stores = [], value, onChange, className }) {
  const { t } = useTranslation();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className ?? inputCls + ' w-auto min-w-[10rem]'}
    >
      <option value="">{t('stockReports.allStores')}</option>
      {stores.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
  );
}
