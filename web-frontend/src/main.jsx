// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/config';
import App from './App.jsx';
import './index.css';
import './styles/admin-responsive.css';
import { syncRootTheme } from './store/themeStore';
import { usePrintSettingsStore } from './store/printSettingsStore';
import { syncPrintCssVars } from './utils/syncPrintCssVars';

syncRootTheme();
syncPrintCssVars(usePrintSettingsStore.getState());
usePrintSettingsStore.persist.onFinishHydration(() => {
  syncPrintCssVars(usePrintSettingsStore.getState());
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
