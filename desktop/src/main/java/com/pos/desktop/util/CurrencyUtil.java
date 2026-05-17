package com.pos.desktop.util;

import java.text.NumberFormat;
import java.util.Locale;

public class CurrencyUtil {

    private static final NumberFormat KES_FMT;

    static {
        KES_FMT = NumberFormat.getCurrencyInstance(new Locale("en", "KE"));
    }

    public static String format(double amount) {
        return KES_FMT.format(amount);
    }

    public static String format(Double amount) {
        return amount == null ? "KES 0.00" : format(amount.doubleValue());
    }
}
