import { convertUnitQuantity, getUnitConfig, getUnitConversions } from './unitConfig';
import { roundQty } from './quantityFormat';

export function conversionsIntoStockUnit(stockUnitCode) {
  return getUnitConversions().filter((c) => c.toCode === stockUnitCode);
}

export function inputAlternativesForStockUnit(stockUnitCode) {
  return conversionsIntoStockUnit(stockUnitCode).map((c) => ({
    fromCode: c.fromCode,
    toCode: c.toCode,
    factor: Number(c.factor),
    label: getUnitConfig(c.fromCode).label,
  }));
}

export function convertToStockUnit(fromCode, stockUnitCode, quantity) {
  const cfg = getUnitConfig(stockUnitCode);
  const raw = convertUnitQuantity(fromCode, stockUnitCode, Number(quantity));
  if (!Number.isFinite(raw)) return null;
  return cfg.scale === 0 ? Math.round(raw) : roundQty(raw);
}

export function coilLengthToMeters(coilCount, metersPerCoil) {
  const coils = Number(coilCount);
  const len = Number(metersPerCoil);
  if (!Number.isFinite(coils) || !Number.isFinite(len) || coils <= 0 || len <= 0) return null;
  return roundQty(coils * len);
}
