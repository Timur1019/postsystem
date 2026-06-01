import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/** Загружает настройки брендинга/чека с сервера после входа (веб и десктоп). */
export default function TenantDisplayBootstrap({ children }) {
  const token = useAuthStore((s) => s.token);
  const fetchFromServer = useTenantDisplayStore((s) => s.fetchFromServer);

  useEffect(() => {
    if (token) {
      fetchFromServer();
    }
  }, [token, fetchFromServer]);

  return children;
}
