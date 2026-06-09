import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModuleAccess } from '../../../hooks/useModuleAccess';
import { REPORTS_HUB_SALES_LINKS, REPORTS_HUB_STOCK_LINKS } from '../constants/reportsHubLinks';

export function useReportsHubPage() {
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();

  const salesLinks = useMemo(
    () => REPORTS_HUB_SALES_LINKS.filter((item) => hasModule(item.moduleId)),
    [hasModule]
  );

  const stockLinks = useMemo(
    () => REPORTS_HUB_STOCK_LINKS.filter((item) => hasModule(item.moduleId)),
    [hasModule]
  );

  return { t, salesLinks, stockLinks };
}
