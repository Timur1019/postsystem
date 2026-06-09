import { Link } from 'react-router-dom';

const LINKS = [
  { to: '/reports/sales/by-products', key: 'linkSalesByProducts' },
  { to: '/reports/stock/write-offs', key: 'linkWriteOffs' },
  { to: '/reports/stock/turnover', key: 'linkTurnover' },
  { to: '/reports/stock/lifecycle', key: 'linkLifecycle' },
  { to: '/reports/stock/movements', key: 'linkMovements' },
  { to: '/reports/stock/receipts', key: 'linkReceipts' },
];

export default function StockDashboardQuickLinks({ t }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {LINKS.map(({ to, key }) => (
        <Link key={to} to={to} className="text-emerald-700 hover:underline dark:text-emerald-400">
          {t(`stockReports.${key}`)}
        </Link>
      ))}
    </div>
  );
}
