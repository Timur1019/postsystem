import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Apple,
  HardDriveDownload,
  Loader,
  Monitor,
} from 'lucide-react';
import LanguageSwitcher from '../components/shared/LanguageSwitcher';
import BrandMark from '../components/shared/BrandMark';
import {
  INSTALLER_BRANDS,
  INSTALLER_MANIFEST_URL,
  brandAccentClasses,
} from '../config/desktopInstallerBrands';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso, locale) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function fetchManifest() {
  const res = await fetch(INSTALLER_MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`manifest ${res.status}`);
  }
  return res.json();
}

function DownloadButton({ href, label, sublabel, icon: Icon, accent, disabled }) {
  const classes = brandAccentClasses(accent);
  if (disabled || !href) {
    return (
      <span className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
        <Icon size={20} className="shrink-0 opacity-50" />
        <span>
          <span className="block font-semibold">{label}</span>
          {sublabel ? <span className="text-xs">{sublabel}</span> : null}
        </span>
      </span>
    );
  }
  return (
    <a
      href={href}
      download
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition ${classes.button}`}
    >
      <Icon size={20} className="shrink-0" />
      <span>
        <span className="block">{label}</span>
        {sublabel ? <span className="block text-xs font-normal text-white/85">{sublabel}</span> : null}
      </span>
    </a>
  );
}

export default function DesktopInstallerPage() {
  const { t, i18n } = useTranslation();
  const { data: manifest, isLoading, isError } = useQuery({
    queryKey: ['desktop-installer-manifest'],
    queryFn: fetchManifest,
    staleTime: 60_000,
    retry: 1,
  });

  const version = manifest?.version;
  const releasedAt = formatDate(manifest?.releasedAt, i18n.language);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-md">
          {INSTALLER_BRANDS.map((brand) => {
            const accent = brandAccentClasses(brand.accent);
            return (
              <article
                key={brand.id}
                className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ${accent.ring}`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${accent.badge}`}
                  >
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{brand.name}</h2>
                    <p className="text-sm text-slate-500">{t(brand.taglineKey)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <DownloadButton
                    href={manifest?.windows?.url}
                    label={t('installer.downloadWindows')}
                    sublabel={
                      manifest?.windows?.size
                        ? formatBytes(manifest.windows.size)
                        : t('installer.notAvailable')
                    }
                    icon={Monitor}
                    accent={brand.accent}
                    disabled={!manifest?.windows?.url}
                  />
                  <DownloadButton
                    href={manifest?.mac?.url}
                    label={t('installer.downloadMac')}
                    sublabel={
                      manifest?.mac?.size
                        ? `${formatBytes(manifest.mac.size)} · ${t('installer.macUniversal')}`
                        : t('installer.notAvailable')
                    }
                    icon={Apple}
                    accent={brand.accent}
                    disabled={!manifest?.mac?.url}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
            <HardDriveDownload size={20} className="text-emerald-600" />
            {t('installer.firstRunTitle')}
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>{t('installer.firstRun1')}</li>
            <li>{t('installer.firstRun2')}</li>
            <li>{t('installer.firstRun3')}</li>
            <li>{t('installer.firstRun4')}</li>
          </ol>
          <p className="mt-4 text-sm text-slate-500">{t('installer.uiUpdateHint')}</p>
        </section>

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
