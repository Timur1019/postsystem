package com.pos.finance.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.Map;

@Getter
public class FinanceException extends RuntimeException {

    private final HttpStatus status;
    private final Map<String, Object> context;

    public FinanceException(HttpStatus status, String message) {
        this(status, message, Map.of());
    }

    public FinanceException(HttpStatus status, String message, Map<String, Object> context) {
        super(message);
        this.status = status;
        this.context = context != null ? context : Map.of();
    }
}
