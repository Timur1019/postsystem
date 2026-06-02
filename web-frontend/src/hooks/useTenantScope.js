import { useAuthStore } from '../store/authStore';

/** companyId текущего пользователя для изоляции кэша React Query. */
export function useTenantScope() {
  const companyId = useAuthStore((s) => s.user?.companyId ?? null);
  const tenantKey = (...parts) => ['tenant', companyId, ...parts];
  return { companyId, tenantKey, tenantReady: companyId != null };
}
