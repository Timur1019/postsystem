package com.pos.service.ai.impl;

import com.pos.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiAssistantRateLimiter {
    private final ConcurrentHashMap<UUID, Deque<Instant>> perUserRequests = new ConcurrentHashMap<>();

    public void enforce(UUID userId, int maxPerMinute) {
        int safeLimit = Math.max(1, maxPerMinute);
        Instant now = Instant.now();
        Instant threshold = now.minusSeconds(60);
        Deque<Instant> queue = perUserRequests.computeIfAbsent(userId, k -> new ArrayDeque<>());
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst().isBefore(threshold)) {
                queue.pollFirst();
            }
            if (queue.size() >= safeLimit) {
                throw new BadRequestException("Слишком много запросов к ассистенту. Повторите через минуту.");
            }
            queue.addLast(now);
        }
    }
}

