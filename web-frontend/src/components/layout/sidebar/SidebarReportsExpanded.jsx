import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { ICONS, REPORT_HUB } from '../layoutNavConfig';

export default function SidebarReportsExpanded({
  t,
  reportsOpen,
  onReportsToggle,
  inReportsSection,
  reportsHubActive,
  reportsSalesOpen,
  onReportsSalesToggle,
  inReportsSalesSection,
  showReportsSales,
  reportsSalesNav,
  reportsStockOpen,
  onReportsStockToggle,
  inReportsStockSection,
  showReportsStock,
  reportsStockNav,
  subLinkClass,
}) {
  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={onReportsToggle}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
          inReportsSection
            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-white'
            : 'text-slate-700 hover:bg-slate-200/80 dark:text-slate-200 dark:hover:bg-emerald-900/30'
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <ICONS.BarChart2 size={18} className="flex-shrink-0 opacity-90" />
          <span className="truncate">{t('nav.reportsGroup')}</span>
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 opacity-80 transition-transform dark:opacity-70 ${reportsOpen ? '' : '-rotate-90'}`}
        />
      </button>
      {reportsOpen ? (
        <div className="ml-4 mt-1 space-y-1 border-l border-slate-300 pl-1 dark:border-emerald-800/50">
          <NavLink
            to={REPORT_HUB.to}
            end
            className={({ isActive }) =>
              `ml-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                isActive || reportsHubActive
                  ? 'border-emerald-500 bg-white text-emerald-900 shadow-sm dark:border-sky-500 dark:bg-slate-950 dark:text-white'
                  : 'border-transparent text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-emerald-900/30'
              }`
            }
          >
            <REPORT_HUB.icon size={16} className="flex-shrink-0 opacity-80" />
            {t(`nav.${REPORT_HUB.key}`)}
          </NavLink>

          {showReportsSales ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={onReportsSalesToggle}
                className={`ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
                  inReportsSalesSection
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-emerald-900/20'
                }`}
              >
                <span className="truncate">{t('nav.reportsSalesGroup')}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform ${reportsSalesOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {reportsSalesOpen ? (
                <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-1 dark:border-emerald-900/40">
                  {reportsSalesNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {showReportsStock ? (
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={onReportsStockToggle}
                className={`ml-2 flex w-[calc(100%-0.5rem)] items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
                  inReportsStockSection
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'text-slate-600 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:bg-emerald-900/20'
                }`}
              >
                <span className="truncate">{t('nav.reportsStockGroup')}</span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 transition-transform ${reportsStockOpen ? '' : '-rotate-90'}`}
                />
              </button>
              {reportsStockOpen ? (
                <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-1 dark:border-emerald-900/40">
                  {reportsStockNav.map(({ to, key, icon: Icon }) => (
                    <NavLink key={to} to={to} className={subLinkClass}>
                      <Icon size={16} className="flex-shrink-0 opacity-80" />
                      {t(`nav.${key}`)}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
