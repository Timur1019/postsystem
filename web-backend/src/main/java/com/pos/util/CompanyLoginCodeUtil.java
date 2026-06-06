package com.pos.util;

import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

import java.util.concurrent.ThreadLocalRandom;

/**
 * Код компании для входа кассира: ровно 5 цифр, диапазон 10000–99999.
 */
public final class CompanyLoginCodeUtil {

    public static final int MIN_CODE = 10_000;
    public static final int MAX_CODE = 99_999;

    private CompanyLoginCodeUtil() {
    }

    /** Нормализует ввод: только цифры, без ведущих нулей (кроме самого числа). */
    public static String normalize(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String digits = raw.trim().replaceAll("\\D", "");
        if (!StringUtils.hasText(digits)) {
            return "";
        }
        int value;
        try {
            value = Integer.parseInt(digits);
        } catch (NumberFormatException ex) {
            throw invalidFormat();
        }
        return format(value);
    }

    public static String format(int code) {
        if (!isValidValue(code)) {
            throw invalidFormat();
        }
        return String.format("%05d", code);
    }

    public static boolean isValid(String code) {
        if (!StringUtils.hasText(code) || !code.matches("\\d{5}")) {
            return false;
        }
        try {
            return isValidValue(Integer.parseInt(code));
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    public static boolean isValidValue(int code) {
        return code >= MIN_CODE && code <= MAX_CODE;
    }

    /** Случайное значение в диапазоне 10000–99999 (включительно). */
    public static int randomValue() {
        int span = MAX_CODE - MIN_CODE + 1;
        return MIN_CODE + ThreadLocalRandom.current().nextInt(span);
    }

    public static BadRequestException invalidFormat() {
        return new BadRequestException(
            "Код входа: 5 цифр, от " + MIN_CODE + " до " + MAX_CODE
        );
    }

    public static BadRequestException codeAlreadyUsed() {
        return new BadRequestException("Такой код входа уже используется");
    }
}
