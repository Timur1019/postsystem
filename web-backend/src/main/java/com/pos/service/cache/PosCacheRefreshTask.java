package com.pos.service.cache;

/**
 * Прогреваемый in-memory кэш (аналитика, журнал продаж, …).
 */
public interface PosCacheRefreshTask {

    /** Имя для логов, напр. {@code analytics}, {@code sales-ledger}. */
    String cacheName();

    void refresh();

    boolean isReady();
}
