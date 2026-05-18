// НДС включён в цену продажи (типично для розницы UZ)
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Доля НДС в сумме, где налог уже включён в цену */
export const extractVatFromInclusive = (inclusiveAmount, ratePercent) => {
  const amount = Number(inclusiveAmount) || 0;
  const rate = Number(ratePercent) || 0;
  if (amount <= 0 || rate <= 0) return 0;
  return round2((amount * rate) / (100 + rate));
};

export const netFromInclusive = (inclusiveAmount, ratePercent) =>
  round2((Number(inclusiveAmount) || 0) - extractVatFromInclusive(inclusiveAmount, ratePercent));
