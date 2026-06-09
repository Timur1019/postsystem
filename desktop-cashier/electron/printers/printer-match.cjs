/**
 * Сопоставление имени принтера из config.json с устройствами Windows.
 */
function matchPrinterName(saved, printers) {
  const want = String(saved || '').trim();
  if (!want || !printers?.length) return null;
  const exact = printers.find((p) => p.name === want);
  if (exact) return exact.name;
  const lower = want.toLowerCase();
  const ci = printers.find((p) => p.name.toLowerCase() === lower);
  if (ci) return ci.name;
  const partialMatches = printers.filter(
    (p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
  );
  if (partialMatches.length === 1) {
    return partialMatches[0].name;
  }
  if (partialMatches.length > 1) {
    const def = partialMatches.find((p) => p.isDefault);
    return (def || partialMatches[0]).name;
  }
  return null;
}

module.exports = { matchPrinterName };
