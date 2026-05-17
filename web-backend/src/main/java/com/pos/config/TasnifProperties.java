package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.tasnif")
public class TasnifProperties {

    private boolean enabled;

    private String baseUrl;

    private int connectTimeoutMs;

    private int readTimeoutMs;

    private int defaultType;

    /** type=1 — ответ с packages (коды упаковки) */
    private int searchType;

    private String defaultLang;
}
