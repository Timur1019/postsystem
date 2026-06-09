import { Apple, Monitor } from 'lucide-react';
import { INSTALLER_BRANDS, brandAccentClasses } from '../../../config/desktopInstallerBrands';
import InstallerDownloadButton from './InstallerDownloadButton';
import { formatInstallerBytes } from '../utils/installerFormatUtils';

export default function DesktopInstallerBrandCards({ t, manifest }) {
  return (
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
              <InstallerDownloadButton
                href={manifest?.windows?.url}
                label={t('installer.downloadWindows')}
                sublabel={
                  manifest?.windows?.size
                    ? formatInstallerBytes(manifest.windows.size)
                    : t('installer.notAvailable')
                }
                icon={Monitor}
                accent={brand.accent}
                disabled={!manifest?.windows?.url}
              />
              <InstallerDownloadButton
                href={manifest?.mac?.url}
                label={t('installer.downloadMac')}
                sublabel={
                  manifest?.mac?.size
                    ? `${formatInstallerBytes(manifest.mac.size)} · ${t('installer.macUniversal')}`
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
  );
}
