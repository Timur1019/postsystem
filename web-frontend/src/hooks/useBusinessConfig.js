import { useQuery } from '@tanstack/react-query';
import { businessConfigApi } from '../services/api';
import { resolveBusinessTypeForTemplates } from '../config/productCatalogTemplateRegistry';

export function useBusinessConfig(businessTypeCode) {
  const code = resolveBusinessTypeForTemplates(businessTypeCode);
  return useQuery({
    queryKey: ['business-config', code],
    queryFn: () => businessConfigApi.byCode(code).then((r) => r.data),
    staleTime: 60_000,
  });
}

export default useBusinessConfig;
