import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtMoney } from '../../utils/formatMoney';
import { round2 } from '../../utils/taxAmounts';
import { measuredLineFromAmount, minQtyForUnit, roundQty } from '../../utils/quantityFormat';
import { getUnitConfig } from '../../utils/unitConfig';
import UnitConversionHelper from '../shared/UnitConversionHelper';
import { useScaleWeight } from '../../scales/useScaleWeight';
import { isDesktopScaleBridge, openScalePicker } from '../../scales/scaleBridge';
import '../../styles/weight-entry-modal.css';

function displayQtyValue(qty, scale) {
  if (qty == null || !Number.isFinite(Number(qty))) return '—';
  const q = scale === 0 ? Math.round(Number(qty)) : roundQty(qty);
  return q.toFixed(scale).replace(/\.?0+$/, '') || '0';
}

function parseDecimalInput(raw) {
  const s = String(raw ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function WeightEntryModal({ open, product, unitPrice, maxStock, onConfirm, onClose }) {
  const { t } = useTranslation();
  const unitCode = product?.unitCode || 'KG';
  const unitConfig = getUnitConfig(unitCode);
  const minQty = minQtyForUnit(unitCode);
  const [mode, setMode] = useState('qty');
  const [qtyDraft, setQtyDraft] = useState('');
  const [amountDraft, setAmountDraft] = useState('');
  const showScaleTab = isDesktopScaleBridge() && unitConfig.hasScale;
  const scale = useScaleWeight(open && showScaleTab);

  useEffect(() => {
    if (!open) return;
    setMode('qty');
    setQtyDraft('');
    setAmountDraft('');
  }, [open, product?.id]);

  useEffect(() => {
    if (mode !== 'scale' || !scale.reading?.kg) return;
    if (scale.reading.stable) {
      setQtyDraft(String(scale.reading.kg));
    }
  }, [mode, scale.reading]);

  const price = Number(unitPrice) || 0;
  const stock = Number(maxStock) || 0;
  const parsedAmount = parseDecimalInput(amountDraft);
  const unit = unitConfig.label;

  const amountLine = useMemo(() => {
    if (mode !== 'amount' || parsedAmount == null || parsedAmount <= 0) return null;
    return measuredLineFromAmount(parsedAmount, price, unitCode);
  }, [mode, parsedAmount, price, unitCode]);

  const enteredQty = useMemo(() => {
    if (mode === 'amount') return amountLine?.qty ?? 0;
    if (mode === 'scale' && scale.reading?.stable && scale.reading.kg > 0) {
      return roundQty(scale.reading.kg);
    }
    if (mode === 'qty') {
      const w = parseDecimalInput(qtyDraft);
      if (w == null) return 0;
      return unitConfig.scale === 0 ? Math.max(minQty, Math.round(w)) : roundQty(w);
    }
    return 0;
  }, [mode, amountLine, qtyDraft, scale.reading, unitConfig.scale, minQty]);

  const lineSum = useMemo(() => {
    if (mode === 'amount') return amountLine?.lineSum ?? 0;
    return round2(enteredQty * price);
  }, [mode, amountLine, enteredQty, price]);

  const confirmUnitPrice = mode === 'amount' ? amountLine?.unitPrice ?? price : price;

  const canConfirm =
    enteredQty >= minQty &&
    lineSum > 0 &&
    (stock <= 0 || enteredQty <= stock + 0.0005) &&
    price > 0;

  if (!open || !product) return null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    const qty = unitConfig.scale === 0 ? Math.round(enteredQty) : roundQty(enteredQty);
    onConfirm(qty, { unitPrice: confirmUnitPrice });
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
    if (kg != null && kg >= minQty) {
      setQtyDraft(String(kg));
      setMode('qty');
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
              {t('pos.measuredPricePerUnit', { price: fmtMoney(price), unit })}
            </p>
            {stock > 0 ? (
              <p className="weight-entry-modal__stock">
                {t('pos.measuredStockAvailable', {
                  qty: displayQtyValue(stock, unitConfig.scale),
                  unit,
                })}
              </p>
            ) : null}
          </div>
        </header>

        <div className="weight-entry-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'qty'}
            className={`weight-entry-modal__tab${mode === 'qty' ? ' is-active' : ''}`}
            onClick={() => setMode('qty')}
          >
            {t('pos.measuredTabQty', { unit })}
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

        {mode === 'qty' ? (
          <label className="weight-entry-modal__field">
            <span>{t('pos.measuredEnterQty', { unit })}</span>
            <input
              type="text"
              inputMode="decimal"
              className="weight-entry-modal__input"
              value={qtyDraft}
              onChange={(e) => setQtyDraft(e.target.value)}
              placeholder={unitConfig.scale === 0 ? '500' : '0.350'}
              autoFocus
            />
            <UnitConversionHelper
              t={t}
              stockUnitCode={unitCode}
              standardLength={product.constructionDetails?.standardLength}
              onApplyStockQty={(qty) => setQtyDraft(String(qty))}
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
                {displayQtyValue(scale.reading?.kg, 3)}
              </span>
              <span className="weight-entry-modal__scale-unit">{unit}</span>
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
              disabled={!scale.reading?.stable || (scale.reading?.kg ?? 0) < minQty}
              onClick={handleTakeFromScale}
            >
              {t('pos.weightScaleTake')}
            </button>
          </div>
        ) : null}

        <p className="weight-entry-modal__preview">
          {t('pos.measuredLinePreview', {
            qty: displayQtyValue(enteredQty, unitConfig.scale),
            unit,
            sum: fmtMoney(lineSum),
          })}
        </p>

        {enteredQty > 0 && stock > 0 && enteredQty > stock ? (
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
