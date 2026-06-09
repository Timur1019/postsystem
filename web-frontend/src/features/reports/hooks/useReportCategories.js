import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../../api/category.api';

export function useReportCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((r) => r.data),
  });
}
