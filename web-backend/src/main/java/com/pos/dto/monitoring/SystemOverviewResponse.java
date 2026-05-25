package com.pos.dto.monitoring;

import java.time.Instant;

/**
 * Сводка состояния сервера для супер-админ панели.
 */
public record SystemOverviewResponse(
    Instant timestamp,
    long uptimeMs,
    String appVersion,
    String activeProfile,

    CpuInfo cpu,
    MemoryInfo memory,
    JvmInfo jvm,
    DatabaseInfo database,
    HttpInfo http,

    int errorCount24h,
    int warnCount24h
) {

    public record CpuInfo(
        Double processUsage,
        Double systemUsage,
        int availableProcessors
    ) {
    }

    public record MemoryInfo(
        long heapUsedBytes,
        long heapMaxBytes,
        Double heapUsedPercent,
        long nonHeapUsedBytes
    ) {
    }

    public record JvmInfo(
        int threadsLive,
        int threadsPeak,
        int threadsDaemon,
        long classesLoaded
    ) {
    }

    public record DatabaseInfo(
        Integer poolActive,
        Integer poolIdle,
        Integer poolMax,
        Integer poolPendingThreads
    ) {
    }

    public record HttpInfo(
        long totalRequests,
        Double avgResponseMs,
        Double maxResponseMs
    ) {
    }
}
