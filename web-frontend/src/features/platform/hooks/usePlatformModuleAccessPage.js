import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi, platformModuleAccessApi } from '../../../api';
import { MODULE_ACCESS_GROUP_ORDER } from '../constants';
import {
  buildTogglesFromDetail,
  catalogGroupFor,
  extractApiError,
} from '../utils/moduleAccessUtils';

export function usePlatformModuleAccessPage() {
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
    setModuleToggles(buildTogglesFromDetail(detail));
  }, [detail]);

  const groupedModules = useMemo(() => {
    const modules = detail?.modules ?? [];
    const byGroup = {};
    for (const row of modules) {
      const cat = catalogGroupFor(row.id, catalogById);
      if (!byGroup[cat]) byGroup[cat] = [];
      byGroup[cat].push(row);
    }
    return MODULE_ACCESS_GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({
      group: g,
      items: byGroup[g],
    }));
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

  const resetMutation = useMutation({
    mutationFn: () => platformModuleAccessApi.resetUser(selectedUserId),
    onSuccess: (res) => {
      toast.success(t('platform.moduleAccess.resetDone'));
      setCustomAccess(false);
      setModuleToggles(buildTogglesFromDetail(res.data));
      qc.invalidateQueries({ queryKey: ['platform-module-access-users', companyId] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-detail', selectedUserId] });
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
    bulkSaveMutation.mutate({ userIds: [...selectedUserIds], payload });
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
    setSelectedUserIds(checked ? new Set(filteredUsers.map((u) => u.userId)) : new Set());
  };

  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.userId));

  const handleCompanyChange = (value) => {
    setCompanyId(value);
    setSelectedUserId(null);
    setSelectedUserIds(new Set());
  };

  const selectedUser = users.find((u) => u.userId === selectedUserId);
  const isSaving = saveMutation.isPending || resetMutation.isPending || bulkSaveMutation.isPending;

  const filterOptions = useMemo(
    () => [
      ['all', t('platform.moduleAccess.filterAll')],
      ['unconfigured', t('platform.moduleAccess.filterUnconfigured')],
      ['custom', t('platform.moduleAccess.filterCustom')],
    ],
    [t]
  );

  return {
    t,
    companies,
    companyId,
    handleCompanyChange,
    usersLoading,
    filteredUsers,
    unconfiguredCount,
    userSearch,
    setUserSearch,
    userFilter,
    setUserFilter,
    filterOptions,
    selectedUserId,
    setSelectedUserId,
    selectedUserIds,
    toggleUserSelection,
    allFilteredSelected,
    handleSelectAllFilteredUsers,
    selectedUser,
    detail,
    detailLoading,
    customAccess,
    setCustomAccess,
    moduleToggles,
    groupedModules,
    handleToggleModule,
    setAllModules,
    handleBulkApply,
    handleSave,
    resetMutation,
    bulkSaveMutation,
    isSaving,
  };
}
