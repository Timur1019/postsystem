export default function CashierTopbarTerminalMeta({ t, storeName, shiftOpenBadge, shift }) {
  if (!storeName && !shiftOpenBadge) return null;

  return (
    <div className="cashier-topbar__terminal-meta d-none d-md-flex">
      {storeName ? (
        <span className="cashier-topbar__terminal-badge" title={storeName}>
          {storeName}
        </span>
      ) : null}
      {shiftOpenBadge ? (
        <span
          className="cashier-topbar__terminal-badge"
          title={shift?.id ? `${t('pos.shiftOpen')} · ${shift.id}` : undefined}
        >
          {shiftOpenBadge}
        </span>
      ) : null}
    </div>
  );
}
