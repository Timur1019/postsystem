import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../utils/formatMoney';
import { qtyFromAmount, roundQty } from '../../utils/quantityFormat';
import { useScaleWeight } from '../../scales/useScaleWeight';
import { isDesktopScaleBridge, openScalePicker } from '../../scales/scaleBridge';
import '../../styles/weight-entry-modal.css';

const MIN_KG = 0.001;

function displayKgValue(kg) {
  if (kg == null || !Number.isFinite(Number(kg))) return '—';
  const q = roundQty(kg);
  return q.toFixed(3).replace(/\.?0+$/, '') || '0';
}

function parseDecimalInput(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function WeightEntryModal({ open, product, unitPrice, maxStock, onConfirm, onClose }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('weight');
  const [weightDraft, setWeightDraft] = useState('');
  const [amountDraft, setAmountDraft] = useState('');
  const showScaleTab = isDesktopScaleBridge();
  const scale = useScaleWeight(open && showScaleTab);

  useEffect(() => {
    if (!open) return;
    setMode('weight');
    setWeightDraft('');
    setAmountDraft('');
  }, [open, product?.id]);

  useEffect(() => {
    if (mode !== 'scale' || !scale.reading?.kg) return;
    if (scale.reading.stable) {
      setWeightDraft(String(scale.reading.kg));
    }
  }, [mode, scale.reading]);

  const price = Number(unitPrice) || 0;
  const stock = Number(maxStock) || 0;

  const weightKg = useMemo(() => {
    if (mode === 'scale' && scale.reading?.stable && scale.reading.kg > 0) {
      return roundQty(scale.reading.kg);
    }
    if (mode === 'weight') {
      const w = parseDecimalInput(weightDraft);
      return w != null ? roundQty(w) : 0;
    }
    return qtyFromAmount(parseDecimalInput(amountDraft), price);
  }, [mode, weightDraft, amountDraft, price, scale.reading]);

  const lineSum = useMemo(() => roundQty(weightKg) * price, [weightKg, price]);

  const canConfirm =
    weightKg >= MIN_KG && (stock <= 0 || weightKg <= stock + 0.0005) && price > 0;

  if (!open || !product) return null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(roundQty(weightKg));
  };

  const handleOpenScaleSetup = async () => {
    try {
      await openScalePicker();
      scale.reconnect();
    } catch {
      /* ignore */
    }
  };

  const handleTakeFromScale = () => {
    const kg = scale.applyToDraft();
    if (kg != null && kg >= MIN_KG) {
      setWeightDraft(String(kg));
      setMode('weight');
    }
  };

  return (
    <div className="weight-entry-modal" role="dialog" aria-modal="true" aria-labelledby="weight-modal-title">
      <button type="button" className="weight-entry-modal__backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="weight-entry-modal__panel">
        <header className="weight-entry-modal__head">
          <h2 id="weight-modal-title" className="weight-entry-modal__title">
            {product.name}
          </h2>
          <div className="weight-entry-modal__meta">
            <p className="weight-entry-modal__price">
              {fmtMoney(price)} {t('pos.weightPricePerKg')}
            </p>
            {stock > 0 ? (
              <p className="weight-entry-modal__stock">
                {t('pos.weightStockAvailable', { qty: roundQty(stock) })}
              </p>
            ) : null}
          </div>
        </header>

        <div className="weight-entry-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'weight'}
            className={`weight-entry-modal__tab${mode === 'weight' ? ' is-active' : ''}`}
            onClick={() => setMode('weight')}
          >
            {t('pos.weightTabKg')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'amount'}
            className={`weight-entry-modal__tab${mode === 'amount' ? ' is-active' : ''}`}
            onClick={() => setMode('amount')}
          >
            {t('pos.weightTabSum')}
          </button>
          {showScaleTab ? (
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'scale'}
              className={`weight-entry-modal__tab${mode === 'scale' ? ' is-active' : ''}`}
              onClick={() => setMode('scale')}
            >
              {t('pos.weightTabScale')}
            </button>
          ) : null}
        </div>

        {mode === 'weight' ? (
          <label className="weight-entry-modal__field">
            <span>{t('pos.weightEnterKg')}</span>
            <input
              type="text"
              inputMode="decimal"
              className="weight-entry-modal__input"
              value={weightDraft}
              onChange={(e) => setWeightDraft(e.target.value)}
              placeholder="0.350"
              autoFocus
            />
          </label>
        ) : null}

        {mode === 'amount' ? (
          <label className="weight-entry-modal__field">
            <span>{t('pos.weightEnterSum')}</span>
            <input
              type="text"
              inputMode="decimal"
              className="weight-entry-modal__input"
              value={amountDraft}
              onChange={(e) => setAmountDraft(e.target.value)}
              placeholder="35000"
              autoFocus
            />
          </label>
        ) : null}

        {mode === 'scale' ? (
          <div className="weight-entry-modal__scale-panel">
            <div className="weight-entry-modal__scale-display">
              <span
                className={`weight-entry-modal__scale-value${
                  scale.reading && !scale.reading.stable ? ' is-unstable' : ''
                }`}
              >
                {displayKgValue(scale.reading?.kg)}
              </span>
              <span className="weight-entry-modal__scale-unit">кг</span>
              <p
                className={`weight-entry-modal__scale-status${
                  scale.reading?.stable ? ' is-stable' : ''
                }`}
              >
                {!scale.available
                  ? t('pos.weightScaleUnavailable')
                  : scale.error
                    ? scale.error
                    : scale.reading?.stable
                      ? t('pos.weightScaleStable')
                      : t('pos.weightScaleUnstable')}
              </p>
            </div>
            <p className="weight-entry-modal__scale-hint">{t('pos.weightScaleHint')}</p>
            {scale.needsSetup || scale.error ? (
              <button
                type="button"
                className="weight-entry-modal__btn weight-entry-modal__btn--ghost weight-entry-modal__btn--block"
                onClick={handleOpenScaleSetup}
              >
                {t('pos.weightScaleSetup')}
              </button>
            ) : null}
            <button
              type="button"
              className="weight-entry-modal__btn weight-entry-modal__btn--scale"
              disabled={!scale.reading?.stable || (scale.reading?.kg ?? 0) < MIN_KG}
              onClick={handleTakeFromScale}
            >
              {t('pos.weightScaleTake')}
            </button>
          </div>
        ) : null}

        <p className="weight-entry-modal__preview">
          {t('pos.weightLinePreview', {
            qty: roundQty(weightKg),
            sum: fmtMoney(lineSum),
          })}
        </p>

        {weightKg > 0 && stock > 0 && weightKg > stock ? (
          <p className="weight-entry-modal__error">{t('pos.weightExceedsStock')}</p>
        ) : null}

        <footer className="weight-entry-modal__actions">
          <button type="button" className="weight-entry-modal__btn weight-entry-modal__btn--ghost" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="weight-entry-modal__btn weight-entry-modal__btn--primary"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {t('pos.weightAddToCart')}
          </button>
        </footer>
      </div>
    </div>
  );
}
