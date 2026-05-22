package com.pos.exception;

import java.util.Map;

public class ConflictException extends PosException {

    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }

    public ConflictException(String message, Map<String, Object> context) {
        super(ErrorCode.CONFLICT, message, context);
    }
}
