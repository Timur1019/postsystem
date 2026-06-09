import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../../../api';
import { useReportDateRange } from './useReportDateRange';
import { useReportStores } from './useReportStores';

export function usePeriodCompareReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, storeId]
  );

  const query = useQuery({
    queryKey: ['reports-period-compare', params],
    queryFn: () => reportApi.periodCompare(params).then((r) => r.data),
    enabled: rangeEnabled,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    rangeEnabled,
    storeId,
    setStoreId,
    stores,
    exportParams: params,
    data: query.data,
    isPending: query.isPending,
  };
}
