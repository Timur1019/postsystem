import { cardCls } from '../../../utils/platformMonitoringFormat';

export default function PlatformMonitoringStatCard({ icon: Icon, color, label, value, hint }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase text-slate-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
