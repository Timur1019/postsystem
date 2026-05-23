package com.pos.cache.support;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * In-memory снимки по tenant (company_id).
 */
public class TenantSnapshotCache<T> {

    private final Map<Integer, AtomicReference<T>> snapshots = new ConcurrentHashMap<>();

    public Optional<T> current(Integer companyId) {
        if (companyId == null) {
            return Optional.empty();
        }
        AtomicReference<T> ref = snapshots.get(companyId);
        return ref == null ? Optional.empty() : Optional.ofNullable(ref.get());
    }

    public void replace(Integer companyId, T value) {
        if (companyId == null || value == null) {
            return;
        }
        snapshots.computeIfAbsent(companyId, id -> new AtomicReference<>()).set(value);
    }

    public void clear(Integer companyId) {
        if (companyId == null) {
            return;
        }
        AtomicReference<T> ref = snapshots.get(companyId);
        if (ref != null) {
            ref.set(null);
        }
    }

    public void clearAll() {
        snapshots.values().forEach(ref -> ref.set(null));
    }

    public boolean hasAny() {
        return snapshots.values().stream().anyMatch(ref -> ref.get() != null);
    }
}
