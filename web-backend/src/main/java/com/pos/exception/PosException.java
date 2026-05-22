package com.pos.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Базовое прикладное исключение: сообщение для клиента + код + контекст для логов.
 */
public class PosException extends RuntimeException {

    private final ErrorCode code;
    private final Map<String, Object> context;

    public PosException(ErrorCode code, String message) {
        this(code, message, null, null);
    }

    public PosException(ErrorCode code, String message, Map<String, Object> context) {
        this(code, message, context, null);
    }

    public PosException(ErrorCode code, String message, Throwable cause) {
        this(code, message, null, cause);
    }

    public PosException(ErrorCode code, String message, Map<String, Object> context, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.context = context == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(context));
    }

    public ErrorCode getCode() {
        return code;
    }

    public Map<String, Object> context() {
        return context;
    }
}
