import { Apple, Loader, Monitor } from 'lucide-react';
import InstallerDownloadButton from './InstallerDownloadButton';
import { formatInstallerBytes } from '../utils/installerFormatUtils';

/** Hero-блок лендинга /install в стиле nodejs.org: заголовок, описание, кнопки скачивания. */
export default function DesktopInstallerHero({ t, manifest, version, releasedAt, isLoading, isError }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          {t('installer.heroTitle')}
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          {t('installer.subtitle')}
        </p>

        <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <InstallerDownloadButton
            href={manifest?.windows?.url}
            label={t('installer.downloadForWindows')}
            sublabel={
              manifest?.windows?.size
                ? `${t('installer.downloadWindows')} · ${formatInstallerBytes(manifest.windows.size)}`
                : t('installer.notAvailable')
            }
            icon={Monitor}
            variant="primary"
            disabled={!manifest?.windows?.url}
          />
          <InstallerDownloadButton
            href={manifest?.mac?.url}
            label={t('installer.downloadForMac')}
            sublabel={
              manifest?.mac?.size
                ? `${t('installer.downloadMac')} · ${formatInstallerBytes(manifest.mac.size)}`
                : t('installer.notAvailable')
            }
            icon={Apple}
            variant="secondary"
            disabled={!manifest?.mac?.url}
          />
        </div>

        <div className="mt-6 min-h-5 text-sm text-slate-500">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader size={15} className="animate-spin" />
              {t('installer.loadingVersion')}
            </span>
          ) : version ? (
            <span>{t('installer.versionLine', { version, date: releasedAt })}</span>
          ) : isError ? (
            <span className="text-amber-700">{t('installer.manifestUnavailable')}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
