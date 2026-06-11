package com.pos.finance.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public final class FinanceExceptions {

    private FinanceExceptions() {
    }

    public static FinanceException badRequest(String message) {
        return new FinanceException(HttpStatus.BAD_REQUEST, message);
    }

    public static FinanceException notFound(String entity, Object id) {
        return new FinanceException(
            HttpStatus.NOT_FOUND,
            entity + " not found: " + id,
            Map.of("entity", entity, "id", String.valueOf(id))
        );
    }

    public static FinanceException forbidden(String message) {
        return new FinanceException(HttpStatus.FORBIDDEN, message);
    }

    public static FinanceException conflict(String message) {
        return new FinanceException(HttpStatus.CONFLICT, message);
    }
}
