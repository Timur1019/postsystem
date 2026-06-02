import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import {
  HANDBOOK_GROUPS,
  modulesForScope,
} from '../config/moduleHandbook';
import { reparentPrintHostToHandbookSlot } from '../utils/autoPrintMount';
import '../styles/handbook-page.css';

export default function HandbookPage({ scope = 'admin' }) {
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

  useEffect(() => {
    reparentPrintHostToHandbookSlot();
    return () => {
      const host = document.getElementById('pos-auto-print-print-host');
      const area = document.getElementById('pos-auto-print-handbook-print-area');
      if (host && area && !area.contains(host)) {
        area.appendChild(host);
      }
    };
  }, [activeId]);

  const groups = HANDBOOK_GROUPS[scope] ?? HANDBOOK_GROUPS.admin;
  const details = t(`handbook.modules.${activeId}.details`, { returnObjects: true });
  const detailList = Array.isArray(details) ? details : [];

  if (!activeId) {
    return null;
  }

  return (
    <div className={`handbook-page${scope === 'cashier' ? ' handbook-page--cashier' : ''}`}>
      <header className="handbook-page__header">
        <div className="handbook-page__header-icon">
          <BookOpen size={22} aria-hidden />
        </div>
        <div>
          <h1 className="handbook-page__title">{t('handbook.title')}</h1>
          <p className="handbook-page__intro">{t('handbook.pageIntro')}</p>
        </div>
      </header>

      <div className="handbook-page__grid">
        <aside className="handbook-page__nav" aria-label={t('handbook.allModules')}>
          {groups.map((groupKey) => {
            const items = visibleModules.filter((m) => m.group === groupKey);
            if (!items.length) return null;
            return (
              <div key={groupKey} className="handbook-page__nav-group">
                <p className="handbook-page__group-label">{t(`handbook.groups.${groupKey}`)}</p>
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`handbook-page__nav-btn${activeId === m.id ? ' handbook-page__nav-btn--active' : ''}`}
                    onClick={() => navigate(`${basePath}/${m.id}`)}
                  >
                    {t(`handbook.modules.${m.id}.title`)}
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <article className="handbook-page__content">
          <h2>{t(`handbook.modules.${activeId}.title`)}</h2>
          <p className="handbook-page__summary">{t(`handbook.modules.${activeId}.summary`)}</p>
          {detailList.length > 0 && (
            <ul className="handbook-page__list">
              {detailList.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <div
            id="pos-auto-print-handbook-print-slot"
            className="handbook-page__print-slot"
            aria-label={t('handbook.printSlot', { defaultValue: 'Последний напечатанный чек' })}
          />
        </article>
      </div>
    </div>
  );
}
