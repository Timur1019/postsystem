import { inputCls } from '../../../../components/ui';

export default function PlatformModuleAccessCompanySelect({ t, companies, companyId, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <label className="module-access-company-select__label mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t('platform.moduleAccess.company')}
      </label>
      <select
        className={`${inputCls} mt-1 max-w-md`}
        value={companyId}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('platform.moduleAccess.selectCompany')}</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
