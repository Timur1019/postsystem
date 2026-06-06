import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../services/api';
import { useTenantScope } from './useTenantScope';
const STORAGE_PREFIX = 'pos.businessType';
const VALID_BUSINESS_TYPES = new Set([
  'CONSTRUCTION', 'GROCERY', 'CLOTHING', 'PHARMACY', 'CANTEEN', 'RESTAURANT', 'AUTO_PARTS', 'UNIVERSAL',
]);

function getStoredBusinessType(companyId) {
  if (companyId == null) return 'UNIVERSAL';
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}.${companyId}`);
    return VALID_BUSINESS_TYPES.has(raw) ? raw : 'UNIVERSAL';
  } catch {
    return 'UNIVERSAL';
  }
}

function clearStoredBusinessType(companyId) {
  if (companyId == null) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}.${companyId}`);
  } catch {
    /* ignore */
  }
}

/**
 * Тип бизнеса компании из API (companies.business_type).
 * Однократно мигрирует значение из localStorage, если в БД ещё UNIVERSAL.
 */
export function useCompanyBusinessType() {
  const { companyId, tenantKey, tenantReady } = useTenantScope();
  const queryClient = useQueryClient();
  const migratedRef = useRef(false);

  const query = useQuery({
    queryKey: tenantKey('company-business-type'),
    queryFn: () => companyBusinessTypeApi.get().then((r) => r.data.businessType),
    staleTime: 300_000,
    enabled: tenantReady,
    placeholderData: 'UNIVERSAL',
  });

  const mutation = useMutation({
    mutationFn: (code) => companyBusinessTypeApi.save(code).then((r) => r.data.businessType),
    onSuccess: (businessType) => {
      queryClient.setQueryData(tenantKey('company-business-type'), businessType);
    },
  });

  useEffect(() => {
    if (!tenantReady || !companyId || migratedRef.current || query.isPending) return;
    const fromApi = query.data ?? 'UNIVERSAL';
    const fromStorage = getStoredBusinessType(companyId);
    if (fromApi === 'UNIVERSAL' && fromStorage !== 'UNIVERSAL') {
      migratedRef.current = true;
      mutation.mutate(fromStorage, {
        onSettled: () => clearStoredBusinessType(companyId),
      });
    }
  }, [tenantReady, companyId, query.data, query.isPending, mutation]);

  return {
    businessType: query.data ?? 'UNIVERSAL',
    isLoading: query.isPending,
    setBusinessType: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
