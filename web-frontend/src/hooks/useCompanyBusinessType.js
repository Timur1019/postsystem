import { useQuery } from '@tanstack/react-query';
import { companyBusinessTypeApi } from '../services/api';
import { useTenantScope } from './useTenantScope';

/**
 * Тип бизнеса компании — используется только как значение по умолчанию при создании магазина.
 * Поля товара определяются типом конкретного магазина (stores.business_type).
 */
export function useCompanyBusinessType() {
  const { tenantKey, tenantReady } = useTenantScope();

  const query = useQuery({
    queryKey: tenantKey('company-business-type'),
    queryFn: () => companyBusinessTypeApi.get().then((r) => r.data.businessType),
    staleTime: 300_000,
    enabled: tenantReady,
    placeholderData: 'UNIVERSAL',
  });

  return {
    businessType: query.data ?? 'UNIVERSAL',
    isLoading: query.isPending,
  };
}
