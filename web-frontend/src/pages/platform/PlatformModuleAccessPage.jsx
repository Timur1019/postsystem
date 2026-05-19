import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Shield, RotateCcw, Save } from 'lucide-react';
import { companyApi, platformModuleAccessApi } from '../../services/api';

const GROUP_ORDER = ['main', 'goods', 'stock', 'orders', 'registers', 'reports', 'settings'];

function catalogGroupFor(moduleId) {
  const groups = {
    dashboard: 'main',
    checkout: 'main',
    products: 'goods',
    categories: 'goods',
    stockProducts: 'stock',
    stockSuppliers: 'stock',
    ordersList: 'orders',
    registersList: 'registers',
    registersZReports: 'registers',
    registersTransfer: 'registers',
    registersConfig: 'registers',
    reportsSales: 'reports',
    reportsReturns: 'reports',
    reportsAnalytics: 'reports',
    stores: 'settings',
    usersList: 'settings',
    usersPrinterSettings: 'settings',
    usersBrandingSettings: 'settings',
  };
  return groups[moduleId] ?? 'main';
}

export default function PlatformModuleAccessPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [customAccess, setCustomAccess] = useState(false);
  const [moduleToggles, setModuleToggles] = useState({});

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['platform-module-access-users', companyId],
    queryFn: () => platformModuleAccessApi.listUsers(Number(companyId)).then((r) => r.data),
    enabled: !!companyId,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['platform-module-access-detail', selectedUserId],
    queryFn: () => platformModuleAccessApi.getUser(selectedUserId).then((r) => r.data),
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    if (!detail) return;
    setCustomAccess(detail.moduleAccessCustom);
    const map = {};
    for (const row of detail.modules ?? []) {
      map[row.id] = row.allowed;
    }
    setModuleToggles(map);
  }, [detail]);

  const groupedModules = useMemo(() => {
    const modules = detail?.modules ?? [];
    const byGroup = {};
    for (const row of modules) {
      const cat = catalogGroupFor(row.id);
      if (!byGroup[cat]) byGroup[cat] = [];
      byGroup[cat].push(row);
    }
    return GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({ group: g, items: byGroup[g] }));
  }, [detail]);

  const saveMutation = useMutation({
    mutationFn: (payload) => platformModuleAccessApi.updateUser(selectedUserId, payload),
    onSuccess: () => {
      setCustomAccess(true);
      toast.success(t('platform.moduleAccess.saved'));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users', companyId] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => {
      const msg = e.response?.data?.message ?? e.response?.data?.errors?.[0] ?? t('common.error');
      toast.error(msg);
    },
  });

  const handleSave = () => {
    if (!selectedUserId) return;
    const hasAny = Object.values(moduleToggles).some(Boolean);
    if (!hasAny) {
      toast.error(t('platform.moduleAccess.needOne'));
      return;
    }
    saveMutation.mutate({ customAccess: true, modules: moduleToggles });
  };

  const handleToggleModule = (moduleId, checked) => {
    setCustomAccess(true);
    setModuleToggles((prev) => ({ ...prev, [moduleId]: checked }));
  };

  const resetMutation = useMutation({
    mutationFn: () => platformModuleAccessApi.resetUser(selectedUserId),
    onSuccess: (res) => {
      toast.success(t('platform.moduleAccess.resetDone'));
      setCustomAccess(false);
      const map = {};
      for (const row of res.data.modules ?? []) {
        map[row.id] = row.allowed;
      }
      setModuleToggles(map);
      qc.invalidateQueries({ queryKey: ['platform-module-access-users', companyId] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('common.error')),
  });

  const selectedUser = users.find((u) => u.userId === selectedUserId);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Shield className="text-emerald-500" size={24} />
          {t('platform.moduleAccess.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('platform.moduleAccess.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('platform.moduleAccess.company')}
        </label>
        <select
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setSelectedUserId(null);
          }}
        >
          <option value="">{t('platform.moduleAccess.selectCompany')}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {companyId ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">
              {t('platform.moduleAccess.users')}
            </div>
            <div className="max-h-[min(70vh,520px)] overflow-y-auto">
              {usersLoading ? (
                <p className="p-4 text-sm text-slate-500">{t('common.loading')}</p>
              ) : users.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">{t('platform.moduleAccess.noUsers')}</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((u) => (
                    <li key={u.userId}>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.userId)}
                        className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          selectedUserId === u.userId ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
                        }`}
                      >
                        <span className="font-medium text-slate-900 dark:text-white">{u.fullName}</span>
                        <span className="text-xs text-slate-500">
                          {u.username} · {t(`roles.${u.role}`, u.role)}
                          {u.moduleAccessCustom ? (
                            <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">
                              {t('platform.moduleAccess.customBadge')}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {!selectedUserId ? (
              <p className="p-6 text-sm text-slate-500">{t('platform.moduleAccess.pickUser')}</p>
            ) : detailLoading ? (
              <p className="p-6 text-sm text-slate-500">{t('common.loading')}</p>
            ) : (
              <>
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedUser?.fullName}</p>
                  <p className="text-xs text-slate-500">{t(`roles.${detail.role}`, detail.role)}</p>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={customAccess}
                      onChange={(e) => setCustomAccess(e.target.checked)}
                    />
                    <span>{t('platform.moduleAccess.useCustom')}</span>
                  </label>
                  {!customAccess ? (
                    <p className="mt-1 text-xs text-amber-600">{t('platform.moduleAccess.customHint')}</p>
                  ) : null}
                </div>

                <div className="max-h-[min(55vh,440px)] space-y-4 overflow-y-auto p-4">
                  {groupedModules.map(({ group, items }) => (
                    <section key={group}>
                      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {t(`platform.moduleGroups.${group}`)}
                      </h3>
                      <ul className="space-y-1">
                        {items.map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {t(`platform.modules.${row.id}`, row.id)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {t('platform.moduleAccess.roleDefault')}:{' '}
                                {row.roleDefault ? t('common.confirmYes', 'Да') : t('common.confirmNo', 'Нет')}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={!!moduleToggles[row.id]}
                              onChange={(e) => handleToggleModule(row.id, e.target.checked)}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                    disabled={resetMutation.isPending || saveMutation.isPending}
                    onClick={() => resetMutation.mutate()}
                  >
                    <RotateCcw size={16} />
                    {t('platform.moduleAccess.resetRole')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    disabled={saveMutation.isPending || resetMutation.isPending}
                    onClick={handleSave}
                  >
                    <Save size={16} />
                    {t('common.save')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
