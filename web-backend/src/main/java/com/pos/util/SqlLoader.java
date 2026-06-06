package com.pos.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class SqlLoader {

    public String load(String classpathPath) {
        try {
            return new String(
                new ClassPathResource(classpathPath).getInputStream().readAllBytes(),
                StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось прочитать SQL: " + classpathPath, e);
        }
    }
}
