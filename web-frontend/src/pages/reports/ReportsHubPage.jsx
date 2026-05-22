import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart2,
  Receipt,
  Warehouse,
  Calculator,
  ArrowLeftRight,
  Store,
  Tags,
  Package,
  UserCog,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
  Truck,
  History,
} from 'lucide-react';
import { useModuleAccess } from '../../hooks/useModuleAccess';

const SALES_LINKS = [
  { to: '/reports/analytics', key: 'reportsAnalytics', icon: BarChart2, moduleId: 'reportsAnalytics' },
  { to: '/reports/sales/daily', key: 'reportsSalesDaily', icon: Calculator, moduleId: 'reportsSalesDaily' },
  { to: '/reports/sales/period-compare', key: 'reportsSalesPeriodCompare', icon: ArrowLeftRight, moduleId: 'reportsSalesPeriodCompare' },
  { to: '/reports/sales/by-stores', key: 'reportsSalesByStores', icon: Store, moduleId: 'reportsSalesByStores' },
  { to: '/reports/sales/by-categories', key: 'reportsSalesByCategories', icon: Tags, moduleId: 'reportsSalesByCategories' },
  { to: '/reports/sales/by-products', key: 'reportsSalesByProducts', icon: Package, moduleId: 'reportsSalesByProducts' },
  { to: '/reports/sales', key: 'reportsSales', icon: Receipt, moduleId: 'reportsSales' },
  { to: '/reports/sales/cashiers', key: 'reportsCashierPerformance', icon: UserCog, moduleId: 'reportsCashierPerformance' },
  { to: '/reports/returns', key: 'reportsReturns', icon: RotateCcw, moduleId: 'reportsReturns' },
];

const STOCK_LINKS = [
  { to: '/reports/stock', key: 'reportsStockDashboard', icon: Warehouse, moduleId: 'reportsStockDashboard' },
  { to: '/reports/stock/balances', key: 'reportsStockBalances', icon: Package, moduleId: 'reportsStockBalances' },
  { to: '/reports/stock/low', key: 'reportsStockLow', icon: AlertTriangle, moduleId: 'reportsStockLow' },
  { to: '/reports/stock/dead', key: 'reportsStockDead', icon: AlertTriangle, moduleId: 'reportsStockDead' },
  { to: '/reports/stock/turnover', key: 'reportsStockTurnover', icon: ArrowLeftRight, moduleId: 'reportsStockTurnover' },
  { to: '/reports/stock/lifecycle', key: 'reportsStockLifecycle', icon: History, moduleId: 'reportsStockLifecycle' },
  { to: '/reports/stock/movements', key: 'reportsStockMovements', icon: ClipboardList, moduleId: 'reportsStockMovements' },
  { to: '/reports/stock/adjustments', key: 'reportsStockAdjustments', icon: ClipboardList, moduleId: 'reportsStockAdjustments' },
  { to: '/reports/stock/receipts', key: 'reportsStockReceipts', icon: Package, moduleId: 'reportsStockReceipts' },
  { to: '/reports/stock/write-offs', key: 'reportsStockWriteOffs', icon: TrendingDown, moduleId: 'reportsStockWriteOffs' },
  { to: '/reports/stock/inventories', key: 'reportsStockInventories', icon: ClipboardList, moduleId: 'reportsStockInventories' },
  { to: '/reports/stock/transfers', key: 'reportsStockTransfers', icon: Truck, moduleId: 'reportsStockTransfers' },
];

function ReportSection({ title, subtitle, links, t }) {
  if (links.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map(({ to, key, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-600"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icon size={20} aria-hidden />
            </span>
            <span className="min-w-0 font-semibold text-slate-900 dark:text-white">{t(`nav.${key}`)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ReportsHubPage() {
  const { t } = useTranslation();
  const { hasModule } = useModuleAccess();

  const salesLinks = SALES_LINKS.filter((item) => hasModule(item.moduleId));
  const stockLinks = STOCK_LINKS.filter((item) => hasModule(item.moduleId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('reportsHub.title')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('reportsHub.subtitle')}</p>
      </div>

      <ReportSection
        title={t('reportsHub.salesSection')}
        subtitle={t('reportsHub.salesSectionHint')}
        links={salesLinks}
        t={t}
      />

      <ReportSection
        title={t('reportsHub.stockSection')}
        subtitle={t('reportsHub.stockSectionHint')}
        links={stockLinks}
        t={t}
      />
    </div>
  );
}
