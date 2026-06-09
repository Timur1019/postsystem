import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../components/shared/LanguageSwitcher';
import DesktopInstallerHeader from '../components/DesktopInstallerHeader';
import DesktopInstallerBrandCards from '../components/DesktopInstallerBrandCards';
import DesktopInstallerFirstRunGuide from '../components/DesktopInstallerFirstRunGuide';
import { useDesktopInstallerPage } from '../hooks/useDesktopInstallerPage';

export default function DesktopInstallerPage() {
  const { t } = useTranslation();
  const { manifest, version, releasedAt, isLoading, isError } = useDesktopInstallerPage();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      <DesktopInstallerHeader
        t={t}
        isLoading={isLoading}
        version={version}
        releasedAt={releasedAt}
        isError={isError}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <DesktopInstallerBrandCards t={t} manifest={manifest} />
        <DesktopInstallerFirstRunGuide t={t} />

        <p className="mt-8 text-center text-sm text-slate-600">
          {t('installer.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            {t('installer.goToLogin')}
          </Link>
        </p>
      </main>
    </div>
  );
}
