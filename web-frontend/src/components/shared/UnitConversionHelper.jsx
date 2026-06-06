import { useMemo, useState } from 'react';
import { getUnitConfig } from '../../utils/unitConfig';
import {
  coilLengthToMeters,
  convertToStockUnit,
  inputAlternativesForStockUnit,
} from '../../utils/unitConversionHelpers';

export default function UnitConversionHelper({
  t,
  stockUnitCode = 'KG',
  standardLength,
  onApplyStockQty,
}) {
  const alternatives = useMemo(
    () => inputAlternativesForStockUnit(stockUnitCode),
    [stockUnitCode]
  );
  const stockLabel = getUnitConfig(stockUnitCode).label;
  const showCoil = stockUnitCode === 'M' && Number(standardLength) > 0;
  const [altCode, setAltCode] = useState('');
  const [altQty, setAltQty] = useState('');
  const [coilCount, setCoilCount] = useState('');

  if (!alternatives.length && !showCoil) return null;

  const handleApplyAlt = () => {
    const q = Number(String(altQty).replace(',', '.'));
    if (!altCode || !Number.isFinite(q) || q <= 0) return;
    const converted = convertToStockUnit(altCode, stockUnitCode, q);
    if (converted == null || converted <= 0) return;
    onApplyStockQty(converted);
    setAltQty('');
  };

  const handleApplyCoil = () => {
    const m = coilLengthToMeters(coilCount, standardLength);
    if (m == null || m <= 0) return;
    onApplyStockQty(m);
    setCoilCount('');
  };

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="font-medium text-amber-900 dark:text-amber-200">
        {t('unitConversion.helperTitle', { unit: stockLabel })}
      </p>

      {alternatives.length > 0 ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-[7rem] flex-1 flex-col gap-1">
            <span className="text-amber-800/80 dark:text-amber-300/80">{t('unitConversion.altUnit')}</span>
            <select
              value={altCode}
              onChange={(e) => setAltCode(e.target.value)}
              className="rounded-md border border-amber-200 bg-white px-2 py-1.5 text-sm dark:border-amber-800 dark:bg-slate-900"
            >
              <option value="">{t('unitConversion.pickUnit')}</option>
              {alternatives.map((a) => (
                <option key={a.fromCode} value={a.fromCode}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-24 flex-col gap-1">
            <span className="text-amber-800/80 dark:text-amber-300/80">{t('unitConversion.qty')}</span>
            <input
              type="text"
              inputMode="decimal"
              value={altQty}
              onChange={(e) => setAltQty(e.target.value)}
              className="rounded-md border border-amber-200 bg-white px-2 py-1.5 text-sm dark:border-amber-800 dark:bg-slate-900"
            />
          </label>
          <button
            type="button"
            onClick={handleApplyAlt}
            disabled={!altCode || !altQty}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {t('unitConversion.apply')}
          </button>
        </div>
      ) : null}

      {showCoil ? (
        <div className="flex flex-wrap items-end gap-2 border-t border-amber-200/80 pt-2 dark:border-amber-900/50">
          <label className="flex w-28 flex-col gap-1">
            <span className="text-amber-800/80 dark:text-amber-300/80">{t('unitConversion.coilCount')}</span>
            <input
              type="text"
              inputMode="numeric"
              value={coilCount}
              onChange={(e) => setCoilCount(e.target.value)}
              placeholder="10"
              className="rounded-md border border-amber-200 bg-white px-2 py-1.5 text-sm dark:border-amber-800 dark:bg-slate-900"
            />
          </label>
          <p className="pb-1.5 text-amber-800/90 dark:text-amber-300/90">
            {t('unitConversion.coilLength', { length: standardLength })}
          </p>
          <button
            type="button"
            onClick={handleApplyCoil}
            disabled={!coilCount}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {t('unitConversion.applyCoil')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
