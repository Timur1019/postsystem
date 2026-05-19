// НДС включён в цену продажи (типично для розницы UZ)
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const PAY_EPS = 0.01;

/** Сумма оплаты больше лимита (с допуском на округление) */
export const exceedsPayAmount = (value, limit) => round2(value) > round2(limit) + PAY_EPS;

/** Ограничить сумму оплатой; не больше limit */
export const clampPayAmount = (value, limit) => {
  const v = round2(value);
  const max = round2(limit);
  return v > max + PAY_EPS ? max : v;
};

/** Доля НДС в сумме, где налог уже включён в цену */
export const extractVatFromInclusive = (inclusiveAmount, ratePercent) => {
  const amount = Number(inclusiveAmount) || 0;
  const rate = Number(ratePercent) || 0;
  if (amount <= 0 || rate <= 0) return 0;
  return round2((amount * rate) / (100 + rate));
};

export const netFromInclusive = (inclusiveAmount, ratePercent) =>
  round2((Number(inclusiveAmount) || 0) - extractVatFromInclusive(inclusiveAmount, ratePercent));
