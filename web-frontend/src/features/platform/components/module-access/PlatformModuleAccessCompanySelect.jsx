import { BaseSelect } from '../../../../components/ui';

export default function PlatformModuleAccessCompanySelect({ t, companies, companyId, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <BaseSelect
        className="mt-1 max-w-md"
        label={t('platform.moduleAccess.company')}
        value={companyId}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('platform.moduleAccess.selectCompany')}
        options={[
          { value: '', label: t('platform.moduleAccess.selectCompany') },
          ...companies.map((c) => ({ value: String(c.id), label: c.name })),
        ]}
      />
    </div>
  );
}
