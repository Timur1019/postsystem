package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.cache")
public class PosCacheProperties {

    /** Скользящее окно в месяцах (аналитика + журнал продаж). */
    private int windowMonths = 2;

    /** Cron: каждый день в 01:00 (см. zoneId). */
    private String refreshCron = "0 0 1 * * *";

    private String zoneId = "Asia/Tashkent";

    /** Потоки пула report-cache-* (агрегаты + чанки журнала). */
    private int loaderThreads = 8;

    private int topProductsLimit = 100;

    private SalesLedger salesLedger = new SalesLedger();

    @Getter
    @Setter
    public static class SalesLedger {

        private boolean enabled = true;

        /** Сколько параллельных запросов к БД при полной пересборке журнала. */
        private int loadChunks = 8;
    }
}
