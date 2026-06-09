import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatTimestamp } from '../../../../utils/platformMonitoringFormat';

function LevelBadge({ level }) {
  const map = {
    ERROR: 'bg-red-500/15 text-red-600 dark:text-red-300',
    WARN: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    INFO: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
    DEBUG: 'bg-slate-500/15 text-slate-500',
  };
  const cls = map[level] || 'bg-slate-500/15 text-slate-500';
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {level}
    </span>
  );
}

export default function PlatformMonitoringLogRow({ event }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setOpen((v) => !v)}>
        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
          {formatTimestamp(event.timestamp)}
        </td>
        <td className="px-3 py-2"><LevelBadge level={event.level} /></td>
        <td className="px-3 py-2 font-mono text-xs text-slate-500">{event.logger}</td>
        <td className="px-3 py-2 text-sm">{event.message}</td>
        <td className="w-8 px-2 py-2 text-slate-400">
          {event.throwable ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
        </td>
      </tr>
      {open && event.throwable ? (
        <tr className="bg-slate-50 dark:bg-slate-900/60">
          <td colSpan={5} className="px-3 pb-3">
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-snug text-slate-100">
              {event.throwable}
            </pre>
          </td>
        </tr>
      ) : null}
    </>
  );
}
