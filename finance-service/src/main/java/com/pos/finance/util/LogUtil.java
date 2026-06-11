package com.pos.finance.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class LogUtil {

    private LogUtil() {
    }

    public static void info(Class<?> source, String message, Object... args) {
        logger(source).info(message, args);
    }

    public static void warn(Class<?> source, String message, Object... args) {
        logger(source).warn(message, args);
    }

    public static void error(Class<?> source, String message, Object... args) {
        logger(source).error(message, args);
    }

    private static Logger logger(Class<?> source) {
        return LoggerFactory.getLogger(source);
    }
}
