import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DesktopInstallerNav from '../components/DesktopInstallerNav';
import DesktopInstallerHero from '../components/DesktopInstallerHero';
import DesktopInstallerFirstRunGuide from '../components/DesktopInstallerFirstRunGuide';
import { useDesktopInstallerPage } from '../hooks/useDesktopInstallerPage';

export default function DesktopInstallerPage() {
  const { t } = useTranslation();
  const { manifest, version, releasedAt, isLoading, isError } = useDesktopInstallerPage();

  return (
    <div className="min-h-screen bg-white">
      <DesktopInstallerNav t={t} />

      <main>
        <DesktopInstallerHero
          t={t}
          manifest={manifest}
          version={version}
          releasedAt={releasedAt}
          isLoading={isLoading}
          isError={isError}
        />

        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
          <DesktopInstallerFirstRunGuide t={t} />

          <p className="mt-8 text-center text-sm text-slate-600">
            {t('installer.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              {t('installer.goToLogin')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
