package com.pos.exception;

/**
 * Стабильный код ошибки для API и логов (не менять имена без необходимости).
 */
public enum ErrorCode {
    BAD_REQUEST,
    NOT_FOUND,
    CONFLICT,
    VALIDATION_FAILED,
    UNAUTHORIZED,
    FORBIDDEN,
    FILE_UPLOAD_ERROR,
    INTERNAL_ERROR
}
