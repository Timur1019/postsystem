import { Shield, UserPlus } from 'lucide-react';
import { BaseButton } from '../../../../components/ui';

export default function PlatformSuperAdminsSection({ t, adminsLoading, superAdmins, onAdd, onEdit }) {
  return (
    <section className="platform-security__card">
      <div className="platform-security__card-head">
        <Shield size={18} className="text-emerald-600" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t('platform.security.superAdminsTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('platform.security.superAdminsHint')}
          </p>
        </div>
        <BaseButton variant="secondary" onClick={onAdd}>
          <UserPlus size={16} />
          {t('platform.security.addSuperAdmin')}
        </BaseButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-4 py-3">{t('platform.security.colName')}</th>
              <th className="px-4 py-3">{t('platform.security.colLogin')}</th>
              <th className="px-4 py-3">{t('platform.security.colEmail')}</th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {adminsLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : superAdmins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  {t('platform.security.emptyAdmins')}
                </td>
              </tr>
            ) : (
              superAdmins.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.fullName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.username}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.email}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
