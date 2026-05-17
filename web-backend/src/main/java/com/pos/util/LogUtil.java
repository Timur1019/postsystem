package com.pos.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Единая точка логирования: сервисы и слой приложения передают {@code Class<?>} источника,
 * чтобы в логах сохранялся корректный logger name без дублирования {@code @Slf4j} по проекту.
 */
public final class LogUtil {

    private LogUtil() {
    }

    private static Logger logger(Class<?> type) {
        return LoggerFactory.getLogger(type);
    }

    public static void trace(Class<?> type, String msg, Object... args) {
        logger(type).trace(msg, args);
    }

    public static void debug(Class<?> type, String msg, Object... args) {
        logger(type).debug(msg, args);
    }

    public static void info(Class<?> type, String msg, Object... args) {
        logger(type).info(msg, args);
    }

    public static void warn(Class<?> type, String msg, Object... args) {
        logger(type).warn(msg, args);
    }

    public static void warn(Class<?> type, String msg, Throwable t) {
        logger(type).warn(msg, t);
    }

    public static void error(Class<?> type, String msg, Object... args) {
        logger(type).error(msg, args);
    }

    public static void error(Class<?> type, String msg, Throwable t) {
        logger(type).error(msg, t);
    }
}
