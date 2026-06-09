export function catalogGroupFor(moduleId, catalogById) {
  return catalogById?.[moduleId] ?? 'main';
}

export function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).find(Boolean);
    if (first) return String(first);
  }
  return fallback;
}

export function buildTogglesFromDetail(detail) {
  const map = {};
  for (const row of detail?.modules ?? []) {
    map[row.id] = row.allowed;
  }
  return map;
}
