package com.pos.exception;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Фабрика исключений с контекстом — где и с чем произошла ошибка попадает в логи.
 */
public final class PosExceptions {

    private PosExceptions() {
    }

    public static BadRequestException badRequest(String message) {
        return new BadRequestException(message);
    }

    public static BadRequestException badRequest(String message, String contextKey, Object contextValue) {
        return new BadRequestException(message, Map.of(contextKey, String.valueOf(contextValue)));
    }

    public static BadRequestException badRequest(String message, Map<String, Object> context) {
        return new BadRequestException(message, context);
    }

    public static ResourceNotFoundException notFound(String entity, Object id) {
        String label = entity != null ? entity : "Resource";
        String msg = id != null ? label + " not found: " + id : label + " not found";
        Map<String, Object> ctx = new LinkedHashMap<>();
        if (entity != null) {
            ctx.put("entity", entity);
        }
        if (id != null) {
            ctx.put("id", String.valueOf(id));
        }
        return new ResourceNotFoundException(msg, ctx);
    }

    public static ResourceNotFoundException notFound(String message) {
        return new ResourceNotFoundException(message);
    }

    public static ConflictException conflict(String message) {
        return new ConflictException(message);
    }

    public static ConflictException conflict(String message, String contextKey, Object contextValue) {
        return new ConflictException(message, Map.of(contextKey, String.valueOf(contextValue)));
    }
}
