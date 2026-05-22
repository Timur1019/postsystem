package com.pos.exception;

import java.util.Map;

public class BadRequestException extends PosException {

    public BadRequestException(String message) {
        super(ErrorCode.BAD_REQUEST, message);
    }

    public BadRequestException(String message, Map<String, Object> context) {
        super(ErrorCode.BAD_REQUEST, message, context);
    }

    public BadRequestException(String message, Throwable cause) {
        super(ErrorCode.BAD_REQUEST, message, cause);
    }

    public BadRequestException(String message, Map<String, Object> context, Throwable cause) {
        super(ErrorCode.BAD_REQUEST, message, context, cause);
    }
}
