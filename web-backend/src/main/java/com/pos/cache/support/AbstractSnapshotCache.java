package com.pos.cache.support;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

/**
 * In-memory снимок: {@link #current()}, {@link #replace(Object)}, {@link #clear()}.
 */
public abstract class AbstractSnapshotCache<T> {

    private final AtomicReference<T> snapshot = new AtomicReference<>();

    public Optional<T> current() {
        return Optional.ofNullable(snapshot.get());
    }

    public void replace(T value) {
        snapshot.set(value);
    }

    public void clear() {
        snapshot.set(null);
    }
}
