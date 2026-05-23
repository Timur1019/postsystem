package com.pos.exception;

public class CacheRefreshException extends PosException {

    public CacheRefreshException(String message) {
        super(ErrorCode.INTERNAL_ERROR, message);
    }

    public CacheRefreshException(String message, Throwable cause) {
        super(ErrorCode.INTERNAL_ERROR, message, cause);
    }
}
