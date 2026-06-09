# Web Frontend — Architecture

React 18 + Vite + Zustand + React Query + Tailwind (admin) + Bootstrap (cashier only).

## Folder layout

```
src/
├── api/                 # HTTP client + domain API modules
├── components/
│   ├── ui/              # BaseButton, BaseInput, BaseModal, BaseTable, PageLayout
│   ├── layout/          # App shells, sidebar
│   ├── shared/          # Cross-cutting UI (pagination, report date bar, portals)
│   ├── receipt/         # Fiscal receipt UI — index.js barrel
│   ├── product-stock/   # Stock adjust / warehouse receive modals — index.js barrel
│   ├── sale-return/     # Return line editors — index.js barrel
│   ├── pos/             # POS return modal — index.js barrel
│   └── tasnif/          # Tasnif package picker
├── features/            # Vertical modules (bounded contexts)
│   ├── auth/
│   ├── cashier/
│   ├── catalog/
│   ├── sales/
│   ├── reports/
│   ├── tenant/
│   ├── stock/
│   ├── dashboard/
│   ├── platform/
│   ├── orders/
│   ├── cash-registers/
│   ├── handbook/
│   ├── support/
│   ├── ai/
│   ├── receipt/
│   └── desktop/
├── hooks/               # Shared hooks (tenant, module access, POS)
├── router/              # Routes, guards, lazyPages.js
├── store/               # Zustand (auth, cart, print — not server data)
└── styles/              # Domain CSS — admin/, cashier/, platform/, shared/, …
```

> **Legacy `src/pages/` removed.** All routes load from `features/*/pages/` via `router/lazyPages.js`.

## Feature module template

```
features/<name>/
├── constants.js
├── hooks/
│   └── use<Name>Page.js       # page state, queries, handlers
├── components/
│   └── <domain>/              # sub-folders per screen area
├── pages/
│   └── <Name>Page.jsx         # thin composition (< 110 lines)
├── utils/                     # UI helpers, formatters (when needed)
└── index.js                   # public API for cross-feature imports
```

### Page pattern

```jsx
// pages/UsersPage.jsx
export default function UsersPage() {
  const p = useUsersPage();
  return (
    <PageLayout title={p.title} actions={…} filters={…}>
      <UsersTable … />
      <UserFormModal … />
    </PageLayout>
  );
}
```

### Component sub-folders (examples)

| Feature | Sub-folder | Contents |
|---------|------------|----------|
| `catalog/products` | `product-info/` | ProductInfoModal shell + detail cards |
| `catalog/products` | `product-lifecycle/` | Lifecycle summary, filters, events table |
| `catalog/products` | `catalog/` | ProductCatalogModal sections |
| `catalog/products` | `products-modals/` | ProductsModals groups (catalog, stock, bulk, …) |
| `catalog/products` | `template-picker/` | ProductTemplatePickerModal |
| `catalog/products` | `product-filters/` | ProductFiltersDrawer |
| `catalog/products` | `tasnif/` | TasnifSearchPanel |
| `platform/module-access` | `users/`, `modules/` | Access panels |
| `reports` | `sales-dashboard/`, `stock-dashboard/`, `write-offs/`, `product-sales/` | Report UI |
| `cashier` | `pin-login/` | PIN login visual, keypad |
| `cash-registers` | shared banners + per-page tables | Z-reports, transfers, config |

## Checklist: new screen

1. API method in `src/api/<domain>.api.js`
2. Hook `use<Name>Page.js` — filters, queries, handlers
3. Components — table, modals, filters (one concern per file)
4. Page `< 110` lines — composition only
5. Route in `router/<shell>.routes.jsx` + `router/lazyPages.js`
6. Export page hook from `features/<name>/index.js` when reused
7. i18n keys in `locales/ru.json` / `uz.json`

## State

| Data | Where |
|------|--------|
| Auth, cart, print settings | Zustand `store/` |
| Lists, reports, CRUD | React Query |
| Form UI | `useState` or react-hook-form + zod |

## Styling (`src/styles/`)

Domain CSS lives in subfolders (mirrors `features/`). **BEM** class names; no inline styles.

```
styles/
├── admin/              # global admin shell — imported from src/index.css
│   ├── index.css       # barrel
│   ├── receipt-page.css
│   ├── electron-silent-print.css
│   ├── receipt-print-root.css
│   ├── print-media.css
│   └── responsive.css
├── cashier/            # POS shell — import index.css in CashierLayout
│   ├── index.css       # barrel (tokens → shell → … → modals)
│   ├── tokens.css      # CSS variables, .cashier-app base
│   ├── shell/          # base, desktop topbar, lang switch
│   ├── register.css
│   ├── cart/              # order panel, line items, totals
│   ├── pay-panel.css
│   ├── catalog-panel/     # panel + legacy-grid
│   ├── my-sales/           # table, shift-stats, master-detail, terminal overrides
│   ├── secondary-pages/    # panel tokens, shift modal, handbook, support
│   ├── terminal-theme/    # terminal overrides
│   ├── light-theme/       # light overrides
│   ├── pos-layout/        # page grid, order rail, responsive
│   ├── register-pay-rail/ # payment rail layout
│   ├── responsive/     # tokens, catalog, narrow, touch, my-sales, …
│   ├── modals/         # return/, payment/, cart-discount
│   └── pin-login.css   # login + lock overlay (standalone import)
├── platform/           # module-access, email, security
├── cash-registers/     # config + details modals
├── catalog/            # product-import
├── tenant/             # users-barcode-print
├── handbook/           # page.css
├── support/            # page.css
└── shared/             # cross-cutting (tasnif-search, shelf labels, overlays)
```

| Shell / area | CSS entry |
|--------------|-----------|
| Admin | Tailwind + `@layer base` in `src/index.css` → `styles/admin/index.css` via `main.jsx` |
| Cashier | Bootstrap + `styles/cashier/index.css` in `CashierLayout` |
| Platform pages | `styles/platform/<page>.css` in each page |
| Feature page | `styles/<domain>/…` next to the screen that owns the BEM block |

**Rules**

- New screen-specific CSS → `styles/<feature>/` (one file per concern).
- Reused by 2+ features → `styles/shared/`.
- Cashier shell styles → only via `cashier/index.css` (except `pin-login.css` on login/lock routes).
- Tailwind utility classes for admin; custom CSS only where Bootstrap/Tailwind is not enough.

## Shared UI (`components/ui`)

| Component | Use |
|-----------|-----|
| `PageLayout` | Title + actions + filters + content |
| `PageSearchField` | Search input with icon |
| `ErrorBanner` | API error at top of page |
| `BaseButton` / `BaseInput` / `BaseModal` / `BaseTable` | Forms and tables |

## Cross-feature imports

```javascript
// ✅ via barrel
import { ProductCatalogModal, useProductsPage } from '../features/catalog';
import { WriteOffModal } from '../features/stock';

// ❌ deep path into another feature
import ProductCatalogModal from '../features/catalog/components/products/ProductCatalogModal';
```

When two features need the same UI, move it to `components/<domain>/` (receipt, product-stock, sale-return, pos, tasnif).

## Feature barrels (public hooks)

| Feature | Exported hooks (sample) |
|---------|-------------------------|
| `auth` | `useLoginPage` |
| `cashier` | `usePosPage`, `usePosPaymentFlow`, `useCashierMySalesPage`, `useCashierPinLoginPage` |
| `receipt` | `useReceiptPage` |
| `catalog` | `useProductsPage`, `useTasnifSearchPanel`, `useProductLifecycleSection` |
| `reports` | `useReportsPage`, `useStockDashboardPage`, `useWriteOffsReportPage`, … |
| `platform` | `usePlatformModuleAccessPage`, `usePlatformMonitoringPage`, … |
| `tenant` | `useUsersPage`, `useStoresPage` |
| `dashboard` | `useDashboardPage` |

## Code splitting (Vite)

Manual chunks only for heavy isolated bundles (avoids circular chunk warnings):

- `cashier` — POS + cashier shell
- `cash-registers` — register / Z-report screens

All other routes split via `React.lazy()` in `router/lazyPages.js`.

## Shells

| Shell | Path | Layout |
|-------|------|--------|
| Admin | `/` | `AppShellLayout` |
| Cashier | `/cashier/*` | `CashierLayout` |
| Platform | `/platform/*` | `SuperAdminLayout` |

Guards: `router/guards/`.
