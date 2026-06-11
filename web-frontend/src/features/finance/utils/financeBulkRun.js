export async function financeBulkRun(items, action) {
  const results = await Promise.allSettled(items.map((item) => action(item)));
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - succeeded;
  return { succeeded, failed, total: results.length };
}
