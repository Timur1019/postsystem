package com.pos.util;

import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class PersonNameUtil {

    private PersonNameUtil() {}

    public static String buildFullName(String lastName, String firstName, String patronymic) {
        return Stream.of(lastName, firstName, patronymic)
            .filter(s -> s != null && !s.isBlank())
            .map(String::trim)
            .collect(Collectors.joining(" "));
    }
}
