package com.pos.cache.salesledger;

import java.util.Optional;
import java.util.UUID;

public interface SalesLedgerCache {

    Optional<SalesLedgerSnapshot> current();

    void replace(SalesLedgerSnapshot snapshot);

    void upsert(SalesLedgerEntry entry);

    void remove(UUID saleId);
}
