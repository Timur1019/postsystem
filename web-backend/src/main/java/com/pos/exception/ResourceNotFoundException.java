package com.pos.exception;

import java.util.Map;

public class ResourceNotFoundException extends PosException {

    public ResourceNotFoundException(String message) {
        super(ErrorCode.NOT_FOUND, message);
    }

    public ResourceNotFoundException(String message, Map<String, Object> context) {
        super(ErrorCode.NOT_FOUND, message, context);
    }
}
