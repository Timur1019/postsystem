package com.pos.util;

import com.pos.exception.BadRequestException;
import com.pos.exception.ConflictException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.function.Supplier;

/**
 * Maps JDBC / JPA errors to client-facing business exceptions.
 */
public final class DbExceptionTranslator {

    private DbExceptionTranslator() {
    }

    public static String clientMessage(Throwable ex) {
        String root = rootCauseMessage(ex);
        String lower = root.toLowerCase();

        if (lower.contains("pin_digest") || lower.contains("module_access_custom")) {
            return "Схема БД устарела: на сервере выполните bash deploy/git-update.sh";
        }
        if (lower.contains("does not exist") && lower.contains("column")) {
            return "Схема БД устарела: на сервере выполните bash deploy/git-update.sh";
        }
        if (lower.contains("read-only transaction")) {
            return "Ошибка записи в БД (read-only transaction). Перезапустите backend.";
        }
        if (lower.contains("lazyinitialization")) {
            return "Ошибка загрузки данных. Обновите backend и повторите запрос.";
        }
        if (lower.contains("uq_users_tenant_username")
            || (lower.contains("duplicate key") && lower.contains("username"))) {
            return "Логин уже занят (такой username уже есть в системе)";
        }
        if (lower.contains("uq_users_company_email")
            || (lower.contains("duplicate key") && lower.contains("email"))) {
            return "Email уже зарегистрирован в этой компании";
        }
        if (lower.contains("uq_users_company_pin_digest")) {
            return "Такой PIN уже используется в компании";
        }
        if (lower.contains("duplicate key") || lower.contains("unique constraint")) {
            return "Пользователь с такими данными уже существует";
        }
        if (lower.contains("foreign key") || lower.contains("violates foreign key")) {
            return "Неверная компания, магазин или роль";
        }
        return "Ошибка БД: " + truncate(root, 280);
    }

    public static <T> T persist(Supplier<T> action) {
        try {
            return action.get();
        } catch (BadRequestException | ConflictException ex) {
            throw ex;
        } catch (DataAccessException ex) {
            throw toClientException(ex);
        }
    }

    public static RuntimeException toClientException(Throwable ex) {
        if (ex instanceof DataIntegrityViolationException dive) {
            return new ConflictException(clientMessage(dive));
        }
        String message = clientMessage(ex);
        if (message.contains("уже занят")
            || message.contains("уже зарегистрирован")
            || message.contains("уже существует")
            || message.contains("PIN уже")) {
            return new ConflictException(message);
        }
        return new BadRequestException(message);
    }

    public static String rootCauseMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
    }

    private static String truncate(String value, int maxLen) {
        if (value == null || value.length() <= maxLen) {
            return value != null ? value : "";
        }
        return value.substring(0, maxLen) + "…";
    }
}
