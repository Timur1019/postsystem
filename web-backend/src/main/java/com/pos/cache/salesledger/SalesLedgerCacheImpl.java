package com.pos.cache.salesledger;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class SalesLedgerCacheImpl implements SalesLedgerCache {

    private final AtomicReference<SalesLedgerSnapshot> snapshot = new AtomicReference<>();

    @Override
    public Optional<SalesLedgerSnapshot> current() {
        return Optional.ofNullable(snapshot.get());
    }

    @Override
    public void replace(SalesLedgerSnapshot snapshot) {
        this.snapshot.set(snapshot);
    }

    @Override
    public void upsert(SalesLedgerEntry entry) {
        SalesLedgerSnapshot current = snapshot.get();
        if (current == null || !current.coversInstant(entry.sale().createdAt())) {
            return;
        }
        var next = new ArrayList<>(current.entries());
        next.removeIf(e -> e.sale().id().equals(entry.sale().id()));
        next.add(entry);
        next.sort(Comparator.comparing((SalesLedgerEntry e) -> e.sale().createdAt()).reversed());
        snapshot.set(new SalesLedgerSnapshot(
            current.windowStart(),
            current.windowEnd(),
            current.zone(),
            Instant.now(),
            List.copyOf(next)
        ));
    }

    @Override
    public void remove(UUID saleId) {
        SalesLedgerSnapshot current = snapshot.get();
        if (current == null || saleId == null) {
            return;
        }
        var next = current.entries().stream()
            .filter(e -> !e.sale().id().equals(saleId))
            .toList();
        if (next.size() == current.entries().size()) {
            return;
        }
        snapshot.set(new SalesLedgerSnapshot(
            current.windowStart(),
            current.windowEnd(),
            current.zone(),
            Instant.now(),
            next
        ));
    }
}
