import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { ADMIN_MODULE_IDS, CASHIER_MODULE_IDS } from '../config/moduleHandbook';

/** Проверка доступа к модулю админки (по allowedModules с бэкенда или fallback по роли). */
export function useModuleAccess() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const allowed = user?.allowedModules;
  const custom = user?.moduleAccessCustom;

  const moduleDefs = useMemo(() => [...ADMIN_MODULE_IDS, ...CASHIER_MODULE_IDS], []);

  const hasModule = useCallback(
    (moduleId) => {
      if (!moduleId || !role) return false;
      if (role === 'SUPER_ADMIN') return true;
      if (custom && Array.isArray(allowed)) {
        if (allowed.includes(moduleId)) return true;
        const def = moduleDefs.find((m) => m.id === moduleId);
        return def ? def.roles.includes(role) : false;
      }
      const def = moduleDefs.find((m) => m.id === moduleId);
      return def ? def.roles.includes(role) : false;
    },
    [role, allowed, custom, moduleDefs]
  );

  const hasAnyModule = useCallback(
    (moduleIds) => moduleIds.some((id) => hasModule(id)),
    [hasModule]
  );

  return { hasModule, hasAnyModule, allowedModules: allowed, moduleAccessCustom: custom };
}
