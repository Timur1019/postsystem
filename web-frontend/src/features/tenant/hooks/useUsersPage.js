import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';

export function useUsersPage({ mode = 'tenant' } = {}) {
  const isPlatform = mode === 'platform';
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const [formMode, setFormMode] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');

  const modalOpen = formMode !== null;

  const { data: users = [], isLoading } = useQuery({
    queryKey: isPlatform ? ['users', 'platform'] : tenantKey('users'),
    queryFn: () => userApi.getAll().then((r) => r.data),
    enabled: isPlatform || tenantReady,
  });

  const { mutate: toggleUser } = useMutation({
    mutationFn: (id) => userApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.updated'));
      setMenuId(null);
    },
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.role, user.companyName, user.companyLoginCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = useMemo(() => {
    const start = page * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const openCreate = () => {
    setMenuId(null);
    setFormMode('create');
  };

  const openEdit = (row) => {
    setMenuId(null);
    setFormMode({ type: 'edit', user: row });
  };

  const closeModal = () => setFormMode(null);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const subtitle = t('common.systemUsers', { count: users.length });
  const searchSuffix = search.trim()
    ? ` · ${t('platform.searchResults', { count: filteredUsers.length })}`
    : '';

  return {
    t,
    isPlatform,
    formMode,
    modalOpen,
    menuId,
    setMenuId,
    page,
    pageSize,
    setPage,
    setPageSize,
    search,
    isLoading,
    pageRows,
    total,
    totalPages,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    toggleUser,
    subtitle: `${subtitle}${searchSuffix}`,
    title: isPlatform ? t('platform.usersTitle') : t('users.title'),
    editingUser: formMode?.type === 'edit' ? formMode.user : undefined,
    modalMode: formMode === 'create' ? 'create' : 'edit',
  };
}
