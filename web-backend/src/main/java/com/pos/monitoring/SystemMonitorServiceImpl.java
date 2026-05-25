package com.pos.monitoring;

import com.pos.dto.monitoring.LogEventDto;
import com.pos.dto.monitoring.MetricDetail;
import com.pos.dto.monitoring.MetricSummary;
import com.pos.dto.monitoring.SystemOverviewResponse;
import com.pos.monitoring.log.LogEventBuffer;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.Measurement;
import io.micrometer.core.instrument.Meter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.search.Search;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class SystemMonitorServiceImpl implements SystemMonitorService {

    private final MeterRegistry meterRegistry;
    private final Environment environment;
    private final LogEventBuffer logBuffer;

    @Value("${spring.application.name:pos-backend}")
    private String appName;

    @Override
    public SystemOverviewResponse overview() {
        Instant now = Instant.now();
        Instant since24h = now.minus(Duration.ofHours(24));

        return new SystemOverviewResponse(
            now,
            (long) (gauge("process.uptime") * 1000),
            appName,
            primaryProfile(),
            buildCpu(),
            buildMemory(),
            buildJvm(),
            buildDatabase(),
            buildHttp(),
            logBuffer.countSince(since24h, "ERROR"),
            logBuffer.countSince(since24h, "WARN")
        );
    }

    @Override
    public List<MetricSummary> listMetrics(String search) {
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        Map<String, MetricSummary> uniqueByName = new TreeMap<>();
        for (Meter meter : meterRegistry.getMeters()) {
            String name = meter.getId().getName();
            if (uniqueByName.containsKey(name)) continue;
            if (!needle.isBlank() && !name.toLowerCase(Locale.ROOT).contains(needle)) continue;
            uniqueByName.put(name, new MetricSummary(
                name,
                meter.getId().getType().name(),
                meter.getId().getDescription(),
                meter.getId().getBaseUnit()
            ));
        }
        return uniqueByName.values().stream()
            .sorted(Comparator.comparing(MetricSummary::name))
            .toList();
    }

    @Override
    public Optional<MetricDetail> metricDetail(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        Search search = meterRegistry.find(name);
        var meters = search.meters();
        if (meters.isEmpty()) return Optional.empty();

        Meter first = meters.iterator().next();
        List<MetricDetail.Sample> samples = meters.stream()
            .map(this::sampleOf)
            .toList();
        return Optional.of(new MetricDetail(
            first.getId().getName(),
            first.getId().getType().name(),
            first.getId().getDescription(),
            first.getId().getBaseUnit(),
            samples
        ));
    }

    @Override
    public List<LogEventDto> recentLogs(int limit, String level) {
        return logBuffer.recent(limit, level);
    }

    @Override
    public void clearLogs() {
        logBuffer.clear();
    }

    private MetricDetail.Sample sampleOf(Meter meter) {
        Map<String, String> tagMap = new LinkedHashMap<>();
        for (Tag tag : meter.getId().getTags()) {
            tagMap.put(tag.getKey(), tag.getValue());
        }
        Map<String, Double> measurements = new LinkedHashMap<>();
        for (Measurement m : meter.measure()) {
            measurements.put(m.getStatistic().name(), m.getValue());
        }
        return new MetricDetail.Sample(tagMap, measurements);
    }

    private SystemOverviewResponse.CpuInfo buildCpu() {
        return new SystemOverviewResponse.CpuInfo(
            nullableGauge("process.cpu.usage"),
            nullableGauge("system.cpu.usage"),
            (int) gauge("system.cpu.count")
        );
    }

    private SystemOverviewResponse.MemoryInfo buildMemory() {
        long heapUsed = sumGaugeWithTag("jvm.memory.used", "area", "heap");
        long heapMax = sumGaugeWithTag("jvm.memory.max", "area", "heap");
        long nonHeap = sumGaugeWithTag("jvm.memory.used", "area", "nonheap");
        Double percent = heapMax > 0 ? (heapUsed * 100.0d) / heapMax : null;
        return new SystemOverviewResponse.MemoryInfo(heapUsed, heapMax, percent, nonHeap);
    }

    private SystemOverviewResponse.JvmInfo buildJvm() {
        return new SystemOverviewResponse.JvmInfo(
            (int) gauge("jvm.threads.live"),
            (int) gauge("jvm.threads.peak"),
            (int) gauge("jvm.threads.daemon"),
            (long) gauge("jvm.classes.loaded")
        );
    }

    private SystemOverviewResponse.DatabaseInfo buildDatabase() {
        return new SystemOverviewResponse.DatabaseInfo(
            integerOrNull(nullableGauge("hikaricp.connections.active")),
            integerOrNull(nullableGauge("hikaricp.connections.idle")),
            integerOrNull(nullableGauge("hikaricp.connections.max")),
            integerOrNull(nullableGauge("hikaricp.connections.pending"))
        );
    }

    private SystemOverviewResponse.HttpInfo buildHttp() {
        Search search = meterRegistry.find("http.server.requests");
        long total = 0;
        double totalTimeMs = 0;
        double maxMs = 0;
        for (Timer timer : search.timers()) {
            total += timer.count();
            totalTimeMs += timer.totalTime(java.util.concurrent.TimeUnit.MILLISECONDS);
            double m = timer.max(java.util.concurrent.TimeUnit.MILLISECONDS);
            if (m > maxMs) maxMs = m;
        }
        Double avg = total > 0 ? totalTimeMs / total : null;
        return new SystemOverviewResponse.HttpInfo(total, avg, maxMs > 0 ? maxMs : null);
    }

    private String primaryProfile() {
        String[] active = environment.getActiveProfiles();
        if (active.length > 0) return active[0];
        String[] defaults = environment.getDefaultProfiles();
        return defaults.length > 0 ? defaults[0] : "default";
    }

    private double gauge(String name) {
        Double v = nullableGauge(name);
        return v == null ? 0d : v;
    }

    private Double nullableGauge(String name) {
        Gauge g = meterRegistry.find(name).gauge();
        if (g == null) return null;
        double value = g.value();
        return Double.isNaN(value) ? null : value;
    }

    private long sumGaugeWithTag(String name, String tagKey, String tagValue) {
        double sum = 0;
        for (Gauge g : meterRegistry.find(name).tag(tagKey, tagValue).gauges()) {
            double v = g.value();
            if (!Double.isNaN(v)) sum += v;
        }
        return (long) sum;
    }

    private Integer integerOrNull(Double value) {
        return value == null ? null : value.intValue();
    }
}
