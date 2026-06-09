import { HardDriveDownload } from 'lucide-react';

export default function DesktopInstallerFirstRunGuide({ t }) {
  return (
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
  );
}
