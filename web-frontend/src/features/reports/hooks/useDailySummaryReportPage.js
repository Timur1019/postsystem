import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { reportApi } from '../../../api';

export function useDailySummaryReportPage() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const query = useQuery({
    queryKey: ['reports-daily', date],
    queryFn: () => reportApi.daily({ date }).then((r) => r.data),
    enabled: Boolean(date),
  });

  return {
    date,
    setDate,
    data: query.data,
    isPending: query.isPending,
  };
}
