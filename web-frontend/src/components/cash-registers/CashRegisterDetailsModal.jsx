// src/components/cash-registers/CashRegisterDetailsModal.jsx
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { X, Tag, CreditCard, Play, Pause, Pencil, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cashRegisterApi } from '../../services/api';
import '../../styles/cash-register-details.css';

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = typeof iso === 'string' ? parseISO(iso) : new Date(iso);
    return format(d, 'yyyy-MM-dd, HH:mm');
  } catch {
    return '—';
  }
}

function DetailRow({ icon: Icon, label, value, valueClassName = '' }) {
  return (
    <div className="cr-details-modal__row">
      <span className="cr-details-modal__label">
        {Icon ? <Icon size={16} className="shrink-0 opacity-70" aria-hidden /> : null}
        {label}
      </span>
      <span className={`cr-details-modal__value ${valueClassName}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function CashRegisterDetailsModal({ registerId, onClose }) {
  const { t } = useTranslation();

  const { data, isPending, isError } = useQuery({
    queryKey: ['cash-register-detail', registerId],
    queryFn: () => cashRegisterApi.getById(registerId).then((r) => r.data),
    enabled: Boolean(registerId),
  });

  if (!registerId) return null;

  const isActive = data?.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        className="cr-details-modal relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-labelledby="cr-details-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id="cr-details-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('cashRegisters.detailsTitle')}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {isPending ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : isError ? (
            <p className="px-5 py-10 text-center text-sm text-red-600">{t('cashRegisters.detailsLoadError')}</p>
          ) : (
            <>
              <section className="cr-details-modal__section">
                <div className="cr-details-modal__grid">
                  <DetailRow icon={Tag} label={t('cashRegisters.detailsModel')} value={data.equipmentModel} />
                  <DetailRow icon={Tag} label={t('cashRegisters.detailsSerial')} value={data.equipmentSerial} />
                  <DetailRow icon={CreditCard} label={t('cashRegisters.detailsFiscal')} value={data.fiscalCardId} />
                  <div className="cr-details-modal__row">
                    <span className="cr-details-modal__label">{t('cashRegisters.detailsStatus')}</span>
                    <span className="cr-details-modal__value">
                      {isActive ? (
                        <span className="cr-details-modal__status-active" title={t('cashRegisters.statusActive')}>
                          <Play size={18} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <Pause size={18} className="text-slate-400" aria-hidden />
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section className="cr-details-modal__section">
                <div className="space-y-4">
                  <DetailRow icon={Pencil} label={t('cashRegisters.detailsStoreName')} value={data.storeName} />
                  <DetailRow label={t('cashRegisters.detailsRegisterNo')} value={data.registerNumber} />
                  <DetailRow
                    icon={MapPin}
                    label={t('cashRegisters.detailsStoreAddress')}
                    value={data.storeAddress}
                    valueClassName="cr-details-modal__value--address"
                  />
                </div>
              </section>

              <section className="cr-details-modal__section">
                <div className="cr-details-modal__grid">
                  <DetailRow
                    icon={Calendar}
                    label={t('cashRegisters.detailsCreatedAt')}
                    value={fmtDateTime(data.createdAt)}
                  />
                  <DetailRow
                    icon={Calendar}
                    label={t('cashRegisters.detailsUpdatedAt')}
                    value={fmtDateTime(data.updatedAt)}
                  />
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="cr-details-modal__footer">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  );
}
