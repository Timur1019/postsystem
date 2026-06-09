import { ShoppingCart, AlertTriangle, DollarSign, Coins, Wallet, Receipt } from 'lucide-react';
import DashboardStatCard from './DashboardStatCard';

export default function DashboardKpiGrid({ t, isSingleDay, kpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardStatCard
        icon={DollarSign}
        label={isSingleDay ? t('dashboard.todayRevenue') : t('dashboard.periodRevenue')}
        value={kpis.revenue}
        sub={t('dashboard.periodTransactions', { count: kpis.txCount })}
        color="emerald"
      />
      <DashboardStatCard
        icon={Coins}
        label={isSingleDay ? t('dashboard.todayCost') : t('dashboard.periodCost')}
        value={kpis.cost}
        sub={t('dashboard.costSubtitle')}
        color="amber"
      />
      <DashboardStatCard
        icon={Wallet}
        label={isSingleDay ? t('dashboard.todayGrossProfit') : t('dashboard.periodGrossProfit')}
        value={kpis.profit}
        sub={t('dashboard.grossProfitSubtitle')}
        color={kpis.profitPositive ? 'emerald' : 'red'}
      />
      <DashboardStatCard
        icon={ShoppingCart}
        label={isSingleDay ? t('dashboard.itemsSoldToday') : t('dashboard.periodItemsSold')}
        value={kpis.itemsSold}
        sub={t('dashboard.unitsSubtitle')}
        color="blue"
      />
      <DashboardStatCard
        icon={Receipt}
        label={t('dashboard.avgCheck')}
        value={kpis.avgCheck}
        sub={t('dashboard.avgCheckSubtitle')}
        color="blue"
      />
      <DashboardStatCard
        icon={AlertTriangle}
        label={t('dashboard.lowStockAlerts')}
        value={kpis.lowStockCount}
        sub={t('dashboard.belowThreshold')}
        color={kpis.lowStockCount > 0 ? 'red' : 'emerald'}
      />
    </div>
  );
}
