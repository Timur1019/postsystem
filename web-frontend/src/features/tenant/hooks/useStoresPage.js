import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi } from '../../../api';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';

export function useStoresPage({ showCompanySelect = false, companyIdFilter, companies = [] } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      companyId: companyIdFilter,
    }),
    [search, page, pageSize, companyIdFilter]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['stores-manage', queryParams],
    queryFn: () => storeApi.getManaged(queryParams).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success(editing ? t('stores.updated') : t('stores.created'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      toast.success(t('stores.updated'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-all'] });
      toast.success(t('stores.deleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.deleteFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const tryDelete = (row) => {
    if (window.confirm(t('stores.deleteConfirm', { name: row.name }))) {
      deleteMutation.mutate(row.id);
    }
  };

  const errorMessage = error?.response?.data?.message ?? error?.message;

  return {
    t,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    modalOpen,
    editing,
    menuId,
    setMenuId,
    rows,
    total,
    totalPages,
    isPending,
    isError,
    errorMessage,
    showCompanySelect,
    companies,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    toggleMutation,
    tryDelete,
  };
}
