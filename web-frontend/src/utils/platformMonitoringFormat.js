export const cardCls =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900';

export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(value > 1 ? value : value * 100).toFixed(1)}%`;
}

export function formatNumber(value, fractionDigits = 0) {
  if (value == null || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDuration(ms) {
  if (ms == null) return '—';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
