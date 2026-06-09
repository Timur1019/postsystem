import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api/store.api';

export function useReportStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });
}
