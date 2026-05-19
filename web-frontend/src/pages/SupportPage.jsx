import { Headphones, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  isSupportConfigured,
  supportPhone,
  supportPhoneHref,
  supportTelegramBot,
  supportTelegramUrl,
} from '../config/support';
import '../styles/support-page.css';

export default function SupportPage() {
  const { t } = useTranslation();
  const telegramUrl = supportTelegramUrl();
  const phoneHref = supportPhoneHref();

  return (
    <div className="support-page">
      <header className="support-page__header">
        <div className="support-page__header-icon" aria-hidden>
          <Headphones size={22} />
        </div>
        <div>
          <h1 className="support-page__title">{t('support.title')}</h1>
          <p className="support-page__intro">{t('support.intro')}</p>
        </div>
      </header>

      {!isSupportConfigured() ? (
        <p className="support-page__empty">{t('support.notConfigured')}</p>
      ) : (
        <div className="support-page__cards">
          {supportPhone ? (
            <section className="support-card">
              <div className="support-card__icon support-card__icon--phone">
                <Phone size={22} aria-hidden />
              </div>
              <div className="support-card__body">
                <h2 className="support-card__title">{t('support.phoneTitle')}</h2>
                <p className="support-card__hint">{t('support.phoneHint')}</p>
                {phoneHref ? (
                  <a href={phoneHref} className="support-card__link">
                    {supportPhone}
                  </a>
                ) : (
                  <p className="support-card__value">{supportPhone}</p>
                )}
              </div>
            </section>
          ) : null}

          {supportTelegramBot && telegramUrl ? (
            <section className="support-card">
              <div className="support-card__icon support-card__icon--telegram">
                <MessageCircle size={22} aria-hidden />
              </div>
              <div className="support-card__body">
                <h2 className="support-card__title">{t('support.telegramTitle')}</h2>
                <p className="support-card__hint">{t('support.telegramHint')}</p>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-card__btn support-card__btn--telegram"
                >
                  {t('support.telegramButton')}
                </a>
                <p className="support-card__bot-name">@{supportTelegramBot}</p>
              </div>
            </section>
          ) : null}
        </div>
      )}

      <aside className="support-page__steps" aria-label={t('support.stepsTitle')}>
        <h3 className="support-page__steps-title">{t('support.stepsTitle')}</h3>
        <ol className="support-page__steps-list">
          <li>{t('support.step1')}</li>
          <li>{t('support.step2')}</li>
          <li>{t('support.step3')}</li>
        </ol>
      </aside>
    </div>
  );
}
