// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (
              id.includes('react-hook-form')
              || id.includes('zod')
              || id.includes('@hookform')
            ) {
              return 'forms';
            }
            if (
              id.includes('react')
              || id.includes('react-dom')
              || id.includes('react-router')
            ) {
              return 'vendor';
            }
            return;
          }

          // Cashier — split by route concern to avoid one 500kB chunk
          if (id.includes('/src/features/cashier/')) {
            if (
              id.includes('/payment/')
              || id.includes('PosPaymentFlow')
              || id.includes('usePosPaymentFlow')
              || id.includes('PosOrderDiscountModal')
            ) {
              return 'cashier-payment';
            }
            if (
              id.includes('/my-sales/')
              || id.includes('CashierMySales')
              || id.includes('useCashierMySales')
            ) {
              return 'cashier-my-sales';
            }
            if (
              id.includes('/pin-login/')
              || id.includes('CashierPinLogin')
              || id.includes('useCashierPinLogin')
              || id.includes('CashierLockOverlay')
              || id.includes('/pages/CashierPinLoginPage')
            ) {
              return 'cashier-pin';
            }
            if (
              id.includes('WeightEntryModal')
              || id.includes('useWeightEntryModal')
              || id.includes('/weight-entry/')
              || id.includes('/scales/')
            ) {
              return 'cashier-weight';
            }
            return 'cashier-pos';
          }
          if (id.includes('/src/features/cash-registers/')) return 'cash-registers';

          // catalog, sales, tenant, stock, reports share components/receipt,
          // product-stock, tasnif — keep in default chunks to avoid cycles
        },
      },
    },
  },
});
