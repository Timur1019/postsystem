import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import ThemedToaster from './components/shared/ThemedToaster';
import HtmlLangSync from './components/shared/HtmlLangSync';
import AuthBootstrap from './components/shared/AuthBootstrap';
import DesktopApiBootstrap from './components/shared/DesktopApiBootstrap';
import TenantDisplayBootstrap from './components/shared/TenantDisplayBootstrap';
import UnitsCatalogBootstrap from './components/shared/UnitsCatalogBootstrap';
import AppRoutes from './router/AppRoutes';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HtmlLangSync />
      <BrowserRouter>
        <AuthBootstrap>
          <DesktopApiBootstrap>
            <TenantDisplayBootstrap>
              <UnitsCatalogBootstrap>
                <AppRoutes />
              </UnitsCatalogBootstrap>
            </TenantDisplayBootstrap>
          </DesktopApiBootstrap>
        </AuthBootstrap>
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  );
}
