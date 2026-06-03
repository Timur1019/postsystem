/** Логи автопечати чека ESC/POS — префикс [Aurent-ESCPOS] для поиска в консоли Electron. */

const PREFIX = '[Aurent-ESCPOS]';

/**
 * Пишет шаг пайплайна печати (jobId + step + опциональные данные).
 * @param {string} jobId
 * @param {string} step
 * @param {Record<string, unknown>} [detail]
 */
function logStep(jobId, step, detail) {
  if (detail && Object.keys(detail).length > 0) {
    console.info(PREFIX, jobId, step, detail);
    return;
  }
  console.info(PREFIX, jobId, step);
}

/**
 * Предупреждение (не фатальное, напр. пропуск логотипа).
 * @param {string} jobId
 * @param {string} step
 * @param {Record<string, unknown>} [detail]
 */
function logWarn(jobId, step, detail) {
  if (detail && Object.keys(detail).length > 0) {
    console.warn(PREFIX, jobId, step, detail);
    return;
  }
  console.warn(PREFIX, jobId, step);
}

/**
 * Ошибка пайплайна.
 * @param {string} jobId
 * @param {string} step
 * @param {unknown} err
 */
function logError(jobId, step, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(PREFIX, jobId, step, msg);
}

/**
 * Уникальный id задания печати.
 * @returns {string}
 */
function createJobId() {
  return `escpos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = {
  PREFIX,
  logStep,
  logWarn,
  logError,
  createJobId,
};
