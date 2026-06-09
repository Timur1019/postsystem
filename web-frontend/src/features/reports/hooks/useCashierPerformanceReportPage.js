import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { reportApi } from '../../../api';
import { useReportDateRange } from './useReportDateRange';

export function useCashierPerformanceReportPage(daysBack = 29) {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(daysBack);

  const query = useQuery({
    queryKey: ['cashier-perf-report', from, to],
    queryFn: () => reportApi.cashierPerf(from, to).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    rangeEnabled,
    rows: query.data ?? [],
    isPending: query.isPending,
  };
}
