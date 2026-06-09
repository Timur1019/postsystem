import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../../api';

export function usePlatformStoresPage() {
  const companiesQuery = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
  });

  return {
    companies: companiesQuery.data ?? [],
    isLoading: companiesQuery.isLoading,
  };
}
