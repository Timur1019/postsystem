package com.pos.service.ai.impl;

import com.pos.service.ai.AnalyticsToolFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
class AiAssistantAnalyticsCache {

    private static final long TTL_MS = 90_000L;

    private final AnalyticsToolFacade toolFacade;
    private final ConcurrentHashMap<String, CachedOverview> cache = new ConcurrentHashMap<>();

    Map<String, Object> executiveOverview(LocalDate from, LocalDate to, Integer companyId) {
        String key = companyId + "|" + from + "|" + to;
        long now = System.currentTimeMillis();
        CachedOverview hit = cache.get(key);
        if (hit != null && hit.expiresAtMs > now) {
            return hit.overview;
        }
        Map<String, Object> fresh = toolFacade.executiveSystemOverview(from, to, companyId);
        cache.put(key, new CachedOverview(fresh, now + TTL_MS));
        return fresh;
    }

    private record CachedOverview(Map<String, Object> overview, long expiresAtMs) {
    }
}
