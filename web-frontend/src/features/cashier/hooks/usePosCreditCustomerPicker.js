import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { customerApi } from '../../../api/customer.api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 300;

export function usePosCreditCustomerPicker({ enabled }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedName, setSelectedName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const listQuery = useQuery({
    queryKey: ['customers', 'pos-credit', debouncedSearch],
    queryFn: () =>
      customerApi
        .getAll({ search: debouncedSearch || undefined, page: 0, size: 30 })
        .then((r) => r.data),
    enabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body) => customerApi.create(body).then((r) => r.data),
    onSuccess: (customer) => {
      setSelectedId(customer.id);
      setSelectedName(customer.name);
      setShowCreate(false);
      setCreateName('');
      setCreatePhone('');
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('pos.creditCustomerCreated'));
    },
    onError: (e) => {
      const msg = e.response?.data?.message ?? e.message ?? t('pos.creditCustomerCreateFailed');
      toast.error(msg);
    },
  });

  const reset = useCallback(() => {
    setSearch('');
    setSelectedId(null);
    setSelectedName('');
    setShowCreate(false);
    setCreateName('');
    setCreatePhone('');
  }, []);

  const selectCustomer = useCallback((customer) => {
    setSelectedId(customer.id);
    setSelectedName(customer.name);
    setShowCreate(false);
  }, []);

  const toggleCreate = useCallback(() => {
    setShowCreate((prev) => !prev);
    if (!showCreate) {
      setSelectedId(null);
      setSelectedName('');
    }
  }, [showCreate]);

  const submitCreate = useCallback(() => {
    const name = createName.trim();
    if (!name) {
      toast.error(t('pos.creditCustomerNameRequired'));
      return;
    }
    createMutation.mutate({
      name,
      phone: createPhone.trim() || undefined,
    });
  }, [createName, createPhone, createMutation, t]);

  const customers = listQuery.data?.content ?? [];

  return {
    search,
    setSearch,
    selectedId,
    selectedName,
    showCreate,
    toggleCreate,
    createName,
    setCreateName,
    createPhone,
    setCreatePhone,
    submitCreate,
    selectCustomer,
    customers,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    isCreating: createMutation.isPending,
    reset,
  };
}
