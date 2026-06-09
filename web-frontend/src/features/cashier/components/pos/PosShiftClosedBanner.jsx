import { DoorOpen } from 'lucide-react';
import { useConnectivityStore, useShouldUseOfflinePos } from '../../../../store/connectivityStore';

export default function PosShiftClosedBanner({
  t,
  openShiftMutation,
  onOpenShift,
  onOpenShiftModal,
}) {
  const offlineDesktop = useShouldUseOfflinePos();
  const canSellOffline = useConnectivityStore((s) => s.canSellOffline);
  const hint =
    offlineDesktop && !canSellOffline
      ? t('offline.openShiftNeedsCatalog')
      : t('pos.shiftRequired');

  return (
    <div className="pos-shift-closed-banner mb-2 flex-shrink-0" role="status">
      <span className="pos-shift-closed-banner__text">{hint}</span>
      <div className="pos-shift-closed-banner__actions">
        <button
          type="button"
          className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
          disabled={openShiftMutation.isPending}
          onClick={onOpenShift}
        >
          <DoorOpen size={16} aria-hidden />
          {t('pos.openShift')}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={false}
          onClick={onOpenShiftModal}
        >
          {t('pos.navShift')}
        </button>
      </div>
    </div>
  );
}
