import { Loader } from 'lucide-react';
import BrandMark from '../../../components/shared/BrandMark';

export default function DesktopInstallerHeader({ t, isLoading, version, releasedAt, isError }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-10 text-center sm:py-12">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
          <BrandMark size={28} iconClassName="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {t('installer.title')}
        </h1>
        <p className="max-w-2xl text-base text-slate-600">{t('installer.subtitle')}</p>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader size={16} className="animate-spin" />
            {t('installer.loadingVersion')}
          </p>
        ) : version ? (
          <p className="text-sm text-slate-500">
            {t('installer.versionLine', { version, date: releasedAt })}
          </p>
        ) : isError ? (
          <p className="text-sm text-amber-700">{t('installer.manifestUnavailable')}</p>
        ) : null}
      </div>
    </header>
  );
}
