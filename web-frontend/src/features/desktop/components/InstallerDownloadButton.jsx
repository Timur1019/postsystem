import { brandAccentClasses } from '../../../config/desktopInstallerBrands';

export default function InstallerDownloadButton({ href, label, sublabel, icon: Icon, accent, disabled }) {
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
