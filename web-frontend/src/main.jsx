// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import App from './App.jsx';
import './index.css';
import './styles/admin-responsive.css';
import { syncRootTheme } from './store/themeStore';
import { usePrintSettingsStore } from './store/printSettingsStore';
import { useTenantDisplayStore } from './store/tenantDisplayStore';
import { syncPrintCssVars } from './utils/syncPrintCssVars';
import { syncReceiptDisplayCssVars } from './utils/syncReceiptDisplayCssVars';

syncRootTheme();
syncPrintCssVars(usePrintSettingsStore.getState());
syncReceiptDisplayCssVars(useTenantDisplayStore.getState().committed);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
