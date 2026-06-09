import { useState } from 'react';
import { format, subDays } from 'date-fns';

export function useReportDateRange(daysBack = 6) {
  const [from, setFrom] = useState(() => format(subDays(new Date(), daysBack), 'yyyy-MM-dd'));
  const [to, setTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  return {
    from,
    to,
    setFrom,
    setTo,
    rangeEnabled: Boolean(from && to),
  };
}
