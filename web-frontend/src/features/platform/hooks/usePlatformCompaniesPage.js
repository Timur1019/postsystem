import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { BUSINESS_TYPES } from '../../../config/productCatalogTemplateRegistry';

export const PLATFORM_COMPANY_PAGE_SIZE = 14;

const emptyForm = () => ({
  name: '',
  legalName: '',
  tin: '',
  address: '',
  phone: '',
  active: true,
  businessType: 'UNIVERSAL',
});

export function usePlatformCompaniesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [menuId, setMenuId] = useState(null);

  const params = useMemo(
    () => ({ page, size: PLATFORM_COMPANY_PAGE_SIZE, search: search.trim() || undefined }),
    [page, search]
  );

  const { data, isPending } = useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyApi.getAll(params).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const { name, legalName, tin, address, phone, active, businessType } = form;
      const payload = { name, legalName, tin, address, phone, active, businessType };
      return editing ? companyApi.update(editing.id, payload) : companyApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(t('platform.companySaved'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => companyApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success(t('platform.companyDeleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.saveFailed')),
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const fromN = total === 0 ? 0 : page * PLATFORM_COMPANY_PAGE_SIZE + 1;
  const toN = Math.min((page + 1) * PLATFORM_COMPANY_PAGE_SIZE, total);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name,
      legalName: row.legalName ?? '',
      tin: row.tin ?? '',
      address: row.address ?? '',
      phone: row.phone ?? '',
      active: row.active,
      businessType: row.businessType ?? 'UNIVERSAL',
    });
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const tryDelete = (row) => {
    const stores = row.storeCount ?? 0;
    if (stores > 0) {
      toast.error(t('platform.deleteCompanyBlockedStores', { count: stores }));
      return;
    }
    if (window.confirm(t('platform.deleteCompanyConfirm'))) {
      deleteMutation.mutate(row.id);
    }
  };

  return {
    t,
    search,
    page,
    modalOpen,
    editing,
    form,
    menuId,
    setMenuId,
    rows,
    isPending,
    total,
    totalPages,
    fromN,
    toN,
    businessTypes: BUSINESS_TYPES,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    updateField,
    handleSearchChange,
    tryDelete,
  };
}
