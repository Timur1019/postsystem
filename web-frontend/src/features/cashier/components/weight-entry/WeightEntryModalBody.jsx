import { fmtMoney } from '../../../../utils/formatMoney';
import UnitConversionHelper from '../../../../components/shared/UnitConversionHelper';

export default function WeightEntryModalBody({ w }) {
  const {
    t,
    product,
    onClose,
    unit,
    unitCode,
    unitConfig,
    minQty,
    mode,
    setMode,
    qtyDraft,
    setQtyDraft,
    amountDraft,
    setAmountDraft,
    showScaleTab,
    scale,
    price,
    stock,
    enteredQty,
    lineSum,
    canConfirm,
    handleConfirm,
    handleOpenScaleSetup,
    handleTakeFromScale,
    displayQtyValue,
  } = w;

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
