import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2 } from 'lucide-react';
import { readImageDataUrl } from '../../../../utils/readImageDataUrl';

export default function LogoUploadField({ label, hint, dataUrl, onSet, onClear, previewSize = 64 }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await readImageDataUrl(file);
      onSet(url);
      toast.success(t('tenantSettings.logoUploaded'));
    } catch (err) {
      if (err.message === 'TOO_LARGE') toast.error(t('tenantSettings.logoTooLarge'));
      else if (err.message === 'NOT_IMAGE') toast.error(t('tenantSettings.logoNotImage'));
      else toast.error(t('tenantSettings.logoUploadFailed'));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50"
          style={{ width: previewSize, height: previewSize }}
        >
          {dataUrl ? (
            <img src={dataUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={24} className="text-slate-400" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {t('tenantSettings.uploadLogo')}
          </button>
          {dataUrl ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Trash2 size={14} />
              {t('tenantSettings.removeLogo')}
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onPick} />
    </div>
  );
}
