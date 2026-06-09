import { BookOpen } from 'lucide-react';
import { useHandbookPage } from '../hooks/useHandbookPage';
import '../../../styles/handbook/page.css';

export default function HandbookPage({ scope = 'admin' }) {
  const r = useHandbookPage(scope);

  if (!r.activeId) {
    return null;
  }

  return (
    <div className={`handbook-page${r.scope === 'cashier' ? ' handbook-page--cashier' : ''}`}>
      <header className="handbook-page__header">
        <div className="handbook-page__header-icon">
          <BookOpen size={22} aria-hidden />
        </div>
        <div>
          <h1 className="handbook-page__title">{r.t('handbook.title')}</h1>
          <p className="handbook-page__intro">{r.t('handbook.pageIntro')}</p>
        </div>
      </header>

      <div className="handbook-page__grid">
        <aside className="handbook-page__nav" aria-label={r.t('handbook.allModules')}>
          {r.groups.map((groupKey) => {
            const items = r.visibleModules.filter((m) => m.group === groupKey);
            if (!items.length) return null;
            return (
              <div key={groupKey} className="handbook-page__nav-group">
                <p className="handbook-page__group-label">{r.t(`handbook.groups.${groupKey}`)}</p>
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`handbook-page__nav-btn${r.activeId === m.id ? ' handbook-page__nav-btn--active' : ''}`}
                    onClick={() => r.navigateToModule(m.id)}
                  >
                    {r.t(`handbook.modules.${m.id}.title`)}
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <article className="handbook-page__content">
          <h2>{r.t(`handbook.modules.${r.activeId}.title`)}</h2>
          <p className="handbook-page__summary">{r.t(`handbook.modules.${r.activeId}.summary`)}</p>
          {r.detailList.length > 0 && (
            <ul className="handbook-page__list">
              {r.detailList.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
