import { Plus, Trash2 } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

export default function PlatformBusinessTypeDetail({
  t,
  detail,
  detailLoading,
  fields,
  onEditType,
  onDeleteType,
  onAddField,
  onEditField,
  onDeleteField,
}) {
  if (!detail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <p className="p-6 text-sm text-slate-500">{t('platform.businessTypes.selectType')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{detail.name}</h2>
          <p className="text-sm text-slate-500">{detail.code}</p>
          {detail.description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{detail.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <BaseButton variant="secondary" size="sm" onClick={onEditType}>
            {t('common.edit')}
          </BaseButton>
          {detail.code !== 'UNIVERSAL' ? (
            <BaseButton
              variant="secondary"
              size="sm"
              className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300"
              onClick={onDeleteType}
            >
              <Trash2 size={14} />
              {t('common.delete')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('platform.businessTypes.fieldsTitle')}
        </h3>
        <BaseButton size="sm" onClick={onAddField}>
          <Plus size={14} />
          {t('platform.businessTypes.addField')}
        </BaseButton>
      </div>

      <div className="overflow-x-auto px-2 pb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">{t('platform.businessTypes.colLabel')}</th>
              <th className="px-2 py-2">{t('platform.businessTypes.colKey')}</th>
              <th className="px-2 py-2">{t('platform.businessTypes.colType')}</th>
              <th className="px-2 py-2">{t('platform.businessTypes.colRequired')}</th>
              <th className="px-2 py-2">{t('platform.businessTypes.colEnabled')}</th>
              <th className="px-2 py-2 text-right">{t('categories.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {detailLoading ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : fields.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                  {t('platform.businessTypes.noFields')}
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr key={field.id}>
                  <td className="px-2 py-2 font-medium">{field.label}</td>
                  <td className="px-2 py-2 font-mono text-xs text-slate-500">{field.fieldKey}</td>
                  <td className="px-2 py-2">{field.fieldType}</td>
                  <td className="px-2 py-2">{field.required ? t('common.yes') : t('common.no')}</td>
                  <td className="px-2 py-2">{field.enabled ? t('common.yes') : t('common.no')}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onEditField(field)}
                      className="mr-2 text-xs text-emerald-600"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteField(field)}
                      className="text-xs text-red-600"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
