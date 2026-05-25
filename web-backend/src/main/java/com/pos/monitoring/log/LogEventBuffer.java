package com.pos.monitoring.log;

import com.pos.dto.monitoring.LogEventDto;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * Кольцевой буфер последних WARN/ERROR событий. Singleton, потому что Logback Appender
 * создаётся вне Spring-контейнера. Доступен из логбэка через {@link #getInstance()}.
 */
public final class LogEventBuffer {

    public static final int DEFAULT_CAPACITY = 500;

    private static final LogEventBuffer INSTANCE = new LogEventBuffer(DEFAULT_CAPACITY);

    public static LogEventBuffer getInstance() {
        return INSTANCE;
    }

    private final int capacity;
    private final Deque<Entry> events = new ArrayDeque<>();

    LogEventBuffer(int capacity) {
        this.capacity = capacity;
    }

    public synchronized void add(Entry entry) {
        if (entry == null) return;
        if (events.size() >= capacity) {
            events.pollFirst();
        }
        events.offerLast(entry);
    }

    public synchronized List<LogEventDto> recent(int limit, String levelFilter) {
        int safeLimit = limit <= 0 ? capacity : Math.min(limit, capacity);
        List<LogEventDto> result = new ArrayList<>(safeLimit);
        var it = events.descendingIterator();
        while (it.hasNext() && result.size() < safeLimit) {
            Entry e = it.next();
            if (levelFilter != null && !levelFilter.isBlank() && !e.level().equalsIgnoreCase(levelFilter)) {
                continue;
            }
            result.add(e.toDto());
        }
        return result;
    }

    public synchronized int countSince(Instant since, String level) {
        if (since == null) return 0;
        int count = 0;
        for (Entry e : events) {
            if (e.timestamp().isAfter(since)
                && (level == null || e.level().equalsIgnoreCase(level))) {
                count++;
            }
        }
        return count;
    }

    public synchronized void clear() {
        events.clear();
    }

    public record Entry(
        Instant timestamp,
        String level,
        String logger,
        String thread,
        String message,
        String throwable
    ) {
        public LogEventDto toDto() {
            return new LogEventDto(timestamp, level, logger, thread, message, throwable);
        }
    }
}
