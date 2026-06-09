import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { HANDBOOK_GROUPS, modulesForScope } from '../../../config/moduleHandbook';

export function useHandbookPage(scope = 'admin') {
  const { t } = useTranslation();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.user?.role);
  const allowedModules = useAuthStore((s) => s.user?.allowedModules);
  const basePath = scope === 'cashier' ? '/cashier/handbook' : '/handbook';

  const visibleModules = useMemo(
    () => modulesForScope(scope, userRole, allowedModules),
    [scope, userRole, allowedModules]
  );

  const activeId = visibleModules.some((m) => m.id === moduleId)
    ? moduleId
    : visibleModules[0]?.id;

  useEffect(() => {
    if (!visibleModules.length) return;
    if (!moduleId || !visibleModules.some((m) => m.id === moduleId)) {
      navigate(`${basePath}/${visibleModules[0].id}`, { replace: true });
    }
  }, [moduleId, visibleModules, navigate, basePath]);

  const groups = HANDBOOK_GROUPS[scope] ?? HANDBOOK_GROUPS.admin;
  const details = t(`handbook.modules.${activeId}.details`, { returnObjects: true });
  const detailList = Array.isArray(details) ? details : [];

  const navigateToModule = (id) => navigate(`${basePath}/${id}`);

  return {
    scope,
    activeId,
    groups,
    visibleModules,
    detailList,
    navigateToModule,
    t,
  };
}
