package com.pos.service.finance;

import java.util.Map;
import java.util.UUID;

public interface FinanceSyncOutboxService {

    UUID enqueue(String eventType, String targetPath, String idempotencyKey, Map<String, Object> payload);

    void trySend(UUID outboxId);

    int processPendingBatch();
}
