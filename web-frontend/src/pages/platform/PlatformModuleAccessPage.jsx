import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Shield, RotateCcw, Save, Search, Users } from 'lucide-react';
import { companyApi, platformModuleAccessApi } from '../../services/api';

const GROUP_ORDER = ['main', 'goods', 'stock', 'orders', 'registers', 'reportsSales', 'reportsStock', 'settings', 'cashier'];

function catalogGroupFor(moduleId, catalogById) {
  return catalogById?.[moduleId] ?? 'main';
}

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).find(Boolean);
    if (first) return String(first);
  }
  return fallback;
}

export default function PlatformModuleAccessPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState(() => new Set());
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [customAccess, setCustomAccess] = useState(false);
  const [moduleToggles, setModuleToggles] = useState({});

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['platform-module-access-catalog'],
    queryFn: () => platformModuleAccessApi.catalog().then((r) => r.data),
  });

  const catalogById = useMemo(() => {
    const map = {};
    for (const row of catalog) {
      map[row.id] = row.group;
    }
    return map;
  }, [catalog]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['platform-module-access-users', companyId],
    queryFn: () => platformModuleAccessApi.listUsers(Number(companyId)).then((r) => r.data),
    enabled: !!companyId,
  });

  const filteredUsers = useMemo(() => {
    let list = users;
    if (userFilter === 'unconfigured') {
      list = list.filter((u) => !u.moduleAccessCustom);
    } else if (userFilter === 'custom') {
      list = list.filter((u) => u.moduleAccessCustom);
    }
    const q = userSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) =>
      [u.fullName, u.username, u.role, u.companyName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, userSearch, userFilter]);

  const unconfiguredCount = useMemo(
    () => users.filter((u) => !u.moduleAccessCustom).length,
    [users]
  );

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
      const cat = catalogGroupFor(row.id, catalogById);
      if (!byGroup[cat]) byGroup[cat] = [];
      byGroup[cat].push(row);
    }
    return GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({ group: g, items: byGroup[g] }));
  }, [detail, catalogById]);

  const saveMutation = useMutation({
    mutationFn: (payload) => platformModuleAccessApi.updateUser(selectedUserId, payload),
    onSuccess: () => {
      setCustomAccess(true);
      toast.success(t('platform.moduleAccess.saved'));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users', companyId] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
    },
    onError: (e) => {
      toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed')));
    },
  });

  const bulkSaveMutation = useMutation({
    mutationFn: async ({ userIds, payload }) => {
      for (const userId of userIds) {
        await platformModuleAccessApi.updateUser(userId, payload);
      }
    },
    onSuccess: (_data, { userIds }) => {
      toast.success(t('platform.moduleAccess.bulkSaved', { count: userIds.length }));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users', companyId] });
      for (const userId of userIds) {
        qc.invalidateQueries({ queryKey: ['platform-module-access-detail', userId] });
      }
    },
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
  });

  const buildModulesPayload = () => {
    const modules = {};
    for (const row of detail?.modules ?? []) {
      modules[row.id] = !!moduleToggles[row.id];
    }
    return modules;
  };

  const buildSavePayload = () => {
    const modules = buildModulesPayload();
    const hasAny = Object.values(modules).some(Boolean);
    if (!hasAny) {
      toast.error(t('platform.moduleAccess.needOne'));
      return null;
    }
    return { customAccess: true, modules };
  };

  const handleSave = () => {
    if (!selectedUserId || !detail?.modules?.length) return;
    if (!customAccess) {
      resetMutation.mutate();
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    saveMutation.mutate(payload);
  };

  const handleBulkApply = () => {
    if (!detail?.modules?.length || selectedUserIds.size === 0) {
      toast.error(t('platform.moduleAccess.pickUsersForBulk'));
      return;
    }
    if (!customAccess) {
      toast.error(t('platform.moduleAccess.enableCustomFirst'));
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    const userIds = [...selectedUserIds];
    bulkSaveMutation.mutate({ userIds, payload });
  };

  const handleToggleModule = (moduleId, checked) => {
    setCustomAccess(true);
    setModuleToggles((prev) => ({ ...prev, [moduleId]: checked }));
  };

  const setAllModules = (enabled, groupFilter = null) => {
    if (!detail?.modules?.length) return;
    setCustomAccess(true);
    setModuleToggles((prev) => {
      const next = { ...prev };
      for (const row of detail.modules) {
        const group = catalogGroupFor(row.id, catalogById);
        if (groupFilter && group !== groupFilter) continue;
        next[row.id] = enabled;
      }
      return next;
    });
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllFilteredUsers = (checked) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.userId)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.userId));

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
    onError: (e) => toast.error(extractApiError(e, t('platform.moduleAccess.saveFailed'))),
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
            setSelectedUserIds(new Set());
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
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{t('platform.moduleAccess.users')}</span>
                {unconfiguredCount > 0 ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                    {t('platform.moduleAccess.unconfiguredCount', { count: unconfiguredCount })}
                  </span>
                ) : null}
              </div>
              <div className="relative mt-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('platform.userSearch')}
                  className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  ['all', t('platform.moduleAccess.filterAll')],
                  ['unconfigured', t('platform.moduleAccess.filterUnconfigured')],
                  ['custom', t('platform.moduleAccess.filterCustom')],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setUserFilter(key)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      userFilter === key
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => handleSelectAllFilteredUsers(e.target.checked)}
                />
                {t('platform.moduleAccess.selectAllVisible', { count: filteredUsers.length })}
              </label>
            </div>
            <div className="max-h-[min(70vh,520px)] overflow-y-auto">
              {usersLoading ? (
                <p className="p-4 text-sm text-slate-500">{t('common.loading')}</p>
              ) : filteredUsers.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">{t('platform.noSearchResults')}</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <li key={u.userId} className="flex items-stretch">
                      <label className="flex items-center px-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(u.userId)}
                          onChange={() => toggleUserSelection(u.userId)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(u.userId)}
                        className={`flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
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
            {selectedUserIds.size > 0 ? (
              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  disabled={!selectedUserId || bulkSaveMutation.isPending || !customAccess}
                  onClick={handleBulkApply}
                >
                  <Users size={16} />
                  {t('platform.moduleAccess.applyToSelected', { count: selectedUserIds.size })}
                </button>
                <p className="mt-1 text-xs text-slate-500">{t('platform.moduleAccess.bulkHint')}</p>
              </div>
            ) : null}
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => setAllModules(true)}
                    >
                      {t('platform.moduleAccess.enableAll')}
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => setAllModules(false)}
                    >
                      {t('platform.moduleAccess.disableAll')}
                    </button>
                  </div>
                </div>

                <div className="max-h-[min(55vh,440px)] space-y-4 overflow-y-auto p-4">
                  {groupedModules.map(({ group, items }) => (
                    <section key={group}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {t(`platform.moduleGroups.${group}`, { defaultValue: group })}
                        </h3>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded border px-1.5 py-0.5 text-[10px]"
                            onClick={() => setAllModules(true, group)}
                          >
                            {t('platform.moduleAccess.allOn')}
                          </button>
                          <button
                            type="button"
                            className="rounded border px-1.5 py-0.5 text-[10px]"
                            onClick={() => setAllModules(false, group)}
                          >
                            {t('platform.moduleAccess.allOff')}
                          </button>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {items.map((row) => (
                          <li
                            key={row.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {t([`platform.modules.${row.id}`, `nav.${row.id}`], { defaultValue: row.id })}
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
                    disabled={saveMutation.isPending || resetMutation.isPending || bulkSaveMutation.isPending}
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
