export default function CashRegisterHintBanner({ title, body }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-emerald-900/90 dark:text-emerald-100/90">{body}</p>
    </div>
  );
}
