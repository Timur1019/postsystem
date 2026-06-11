/** Крупная кнопка скачивания в hero-блоке: primary (Windows) и secondary (Mac). */
const VARIANT_CLASSES = {
  primary: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50',
};

export default function InstallerDownloadButton({ href, label, sublabel, icon: Icon, variant = 'primary', disabled }) {
  if (disabled || !href) {
    return (
      <span className="inline-flex min-w-56 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3.5 text-slate-400">
        <Icon size={22} className="shrink-0 opacity-50" />
        <span className="text-left">
          <span className="block text-sm font-semibold">{label}</span>
          {sublabel ? <span className="block text-xs">{sublabel}</span> : null}
        </span>
      </span>
    );
  }

  return (
    <a
      href={href}
      download
      className={`inline-flex min-w-56 items-center justify-center gap-3 rounded-xl px-6 py-3.5 transition ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary}`}
    >
      <Icon size={22} className="shrink-0" />
      <span className="text-left">
        <span className="block text-sm font-semibold">{label}</span>
        {sublabel ? <span className="block text-xs opacity-80">{sublabel}</span> : null}
      </span>
    </a>
  );
}
