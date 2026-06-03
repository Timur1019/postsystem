/** Ошибки контура ESC/POS (код + шаг — для диагностики на фронте). */

const ESCPOS_ERROR_CODES = Object.freeze({
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  NO_PRINTER: 'NO_PRINTER',
  DRIVER_MISSING: 'DRIVER_MISSING',
  NOT_CONNECTED: 'NOT_CONNECTED',
  BUILD_FAILED: 'BUILD_FAILED',
  EXECUTE_FAILED: 'EXECUTE_FAILED',
});

class EscposPrintError extends Error {
  /**
   * @param {string} code — из ESCPOS_ERROR_CODES
   * @param {string} message — текст для пользователя
   * @param {{ step?: string, cause?: Error }} [meta]
   */
  constructor(code, message, meta = {}) {
    super(message);
    this.name = 'EscposPrintError';
    this.code = code;
    this.step = meta.step || '';
    if (meta.cause) {
      this.cause = meta.cause;
    }
  }

  /** Для IPC: сериализуемый объект. */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      step: this.step,
      message: this.message,
      cause: this.cause?.message,
    };
  }
}

module.exports = {
  ESCPOS_ERROR_CODES,
  EscposPrintError,
};
