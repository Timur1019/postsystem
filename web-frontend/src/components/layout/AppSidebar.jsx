import { NavLink } from 'react-router-dom';
import BrandMark from '../shared/BrandMark';
import { ICONS, REPORT_HUB } from './layoutNavConfig';
import SidebarGroupCompact from './sidebar/SidebarGroupCompact';
import SidebarGroupExpanded from './sidebar/SidebarGroupExpanded';
import SidebarReportsExpanded from './sidebar/SidebarReportsExpanded';

export default function AppSidebar(props) {
  const {
    t,
    displayAppName,
    mobileNavOpen,
    sidebarOpen,
    navLabelsVisible,
    onSidebarTransitionEnd,
    onCloseMobile,
    onLogout,
    topLinkClass,
    subLinkClass,
    showDashboard,
    showAssistant,
    inAssistantSection,
    showGoods,
    showStock,
    showOrders,
    showRegisters,
    showReports,
    showUsers,
    inGoodsSection,
    inStockSection,
    inOrdersSection,
    inRegistersSection,
    inReportsSection,
    inReportsSalesSection,
    inReportsStockSection,
    inUsersSection,
    goodsOpen,
    stockOpen,
    ordersOpen,
    registersOpen,
    reportsOpen,
    reportsSalesOpen,
    reportsStockOpen,
    usersOpen,
    setGoodsOpen,
    setStockOpen,
    setOrdersOpen,
    setRegistersOpen,
    setReportsOpen,
    setReportsSalesOpen,
    setReportsStockOpen,
    setUsersOpen,
    goodsNav,
    stockNav,
    ordersNav,
    registersNav,
    showReportsSales,
    showReportsStock,
    reportsSalesNav,
    reportsStockNav,
    reportsHubActive,
    usersNav,
    visibleRest,
  } = props;

  return (
    <>
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 print:hidden lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        onTransitionEnd={onSidebarTransitionEnd}
        className={`print:hidden fixed inset-y-0 left-0 z-40 flex max-w-[min(100vw,20rem)] flex-col overflow-hidden border-r border-slate-200 bg-slate-50 shadow-xl transition-[transform,width] duration-200 ease-out dark:border-emerald-900/70 dark:bg-emerald-950 lg:static lg:z-auto lg:max-w-none lg:shadow-none ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarOpen ? 'w-[min(100vw,20rem)] lg:w-60' : 'w-[min(100vw,20rem)] lg:w-16'}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-4 dark:border-emerald-900/60">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
            <BrandMark size={16} iconClassName="text-white" />
          </div>
          {navLabelsVisible ? (
            <span className="truncate text-lg font-bold text-slate-900 dark:text-white">{displayAppName()}</span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {showDashboard ? (
            <NavLink to="/dashboard" end className={topLinkClass}>
              <ICONS.LayoutDashboard size={18} className="flex-shrink-0" />
              {navLabelsVisible && t('nav.dashboard')}
            </NavLink>
          ) : null}

          {showAssistant ? (
            <NavLink
              to="/assistant"
              className={({ isActive }) => topLinkClass({ isActive: isActive || inAssistantSection })}
            >
              <ICONS.Bot size={18} className="flex-shrink-0" />
              {navLabelsVisible && t('nav.aiAssistant')}
            </NavLink>
          ) : null}

          <NavLink to="/handbook/dashboard" className={topLinkClass}>
            <ICONS.BookOpen size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.handbook')}
          </NavLink>

          <NavLink to="/support" className={topLinkClass}>
            <ICONS.Headphones size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.support')}
          </NavLink>

          {showGoods
            ? navLabelsVisible ? (
                <SidebarGroupExpanded
                  t={t}
                  label={t('nav.goodsGroup')}
                  icon={ICONS.LayoutGrid}
                  isOpen={goodsOpen}
                  onToggle={() => setGoodsOpen((o) => !o)}
                  isActive={inGoodsSection}
                  items={goodsNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact t={t} items={goodsNav} />
              )
            : null}

          {showStock
            ? navLabelsVisible ? (
                <SidebarGroupExpanded
                  t={t}
                  label={t('nav.stockGroup')}
                  icon={ICONS.Home}
                  isOpen={stockOpen}
                  onToggle={() => setStockOpen((o) => !o)}
                  isActive={inStockSection}
                  items={stockNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact t={t} items={stockNav} />
              )
            : null}

          {showOrders
            ? navLabelsVisible ? (
                <SidebarGroupExpanded
                  t={t}
                  label={t('nav.ordersGroup')}
                  icon={ICONS.Truck}
                  isOpen={ordersOpen}
                  onToggle={() => setOrdersOpen((o) => !o)}
                  isActive={inOrdersSection}
                  items={ordersNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact t={t} items={ordersNav} />
              )
            : null}

          {showRegisters
            ? navLabelsVisible ? (
                <SidebarGroupExpanded
                  t={t}
                  label={t('nav.registersGroup')}
                  icon={ICONS.Calculator}
                  isOpen={registersOpen}
                  onToggle={() => setRegistersOpen((o) => !o)}
                  isActive={inRegistersSection}
                  items={registersNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact t={t} items={registersNav} />
              )
            : null}

          {showReports
            ? navLabelsVisible ? (
                <SidebarReportsExpanded
                  t={t}
                  reportsOpen={reportsOpen}
                  onReportsToggle={() => setReportsOpen((o) => !o)}
                  inReportsSection={inReportsSection}
                  reportsHubActive={reportsHubActive}
                  reportsSalesOpen={reportsSalesOpen}
                  onReportsSalesToggle={() => setReportsSalesOpen((o) => !o)}
                  inReportsSalesSection={inReportsSalesSection}
                  showReportsSales={showReportsSales}
                  reportsSalesNav={reportsSalesNav}
                  reportsStockOpen={reportsStockOpen}
                  onReportsStockToggle={() => setReportsStockOpen((o) => !o)}
                  inReportsStockSection={inReportsStockSection}
                  showReportsStock={showReportsStock}
                  reportsStockNav={reportsStockNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact
                  t={t}
                  items={[REPORT_HUB, ...reportsSalesNav, ...reportsStockNav]}
                />
              )
            : null}

          {showUsers
            ? navLabelsVisible ? (
                <SidebarGroupExpanded
                  t={t}
                  label={t('nav.usersGroup')}
                  icon={ICONS.Users}
                  isOpen={usersOpen}
                  onToggle={() => setUsersOpen((o) => !o)}
                  isActive={inUsersSection}
                  items={usersNav}
                  subLinkClass={subLinkClass}
                />
              ) : (
                <SidebarGroupCompact t={t} items={usersNav} />
              )
            : null}

          {visibleRest.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} className={topLinkClass}>
              <Icon size={18} className="flex-shrink-0" />
              {navLabelsVisible && t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-2 dark:border-emerald-900/60">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <ICONS.LogOut size={18} className="flex-shrink-0" />
            {navLabelsVisible && t('nav.logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
