package com.pos.service.finance.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.config.finance.FinanceServiceProperties;
import com.pos.entity.FinanceSyncOutbox;
import com.pos.repository.FinanceSyncOutboxRepository;
import com.pos.service.finance.FinanceSyncOutboxService;
import com.pos.service.finance.support.FinanceHttpClient;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceSyncOutboxServiceImpl implements FinanceSyncOutboxService {

    private static final List<String> RETRY_STATUSES = List.of("PENDING", "FAILED");

    private final FinanceSyncOutboxRepository outboxRepository;
    private final FinanceHttpClient financeHttpClient;
    private final ObjectMapper objectMapper;
    private final FinanceServiceProperties properties;

    @Override
    @Transactional
    public UUID enqueue(String eventType, String targetPath, String idempotencyKey, Map<String, Object> payload) {
        return outboxRepository.findByIdempotencyKey(idempotencyKey)
            .map(FinanceSyncOutbox::getId)
            .orElseGet(() -> saveNew(eventType, targetPath, idempotencyKey, payload));
    }

    @Override
    @Transactional
    public void trySend(UUID outboxId) {
        if (!properties.isEnabled()) {
            return;
        }
        outboxRepository.findById(outboxId).ifPresent(this::sendOne);
    }

    @Override
    @Transactional
    public int processPendingBatch() {
        if (!properties.isEnabled()) {
            return 0;
        }
        int batchSize = Math.max(properties.getSyncBatchSize(), 1);
        List<FinanceSyncOutbox> rows = outboxRepository.findReadyForRetry(
            RETRY_STATUSES,
            Instant.now(),
            PageRequest.of(0, batchSize)
        );
        for (FinanceSyncOutbox row : rows) {
            sendOne(row);
        }
        return rows.size();
    }

    private UUID saveNew(String eventType, String targetPath, String idempotencyKey, Map<String, Object> payload) {
        try {
            FinanceSyncOutbox row = FinanceSyncOutbox.builder()
                .eventType(eventType)
                .targetPath(targetPath)
                .idempotencyKey(idempotencyKey)
                .payload(objectMapper.writeValueAsString(payload))
                .status("PENDING")
                .attempts(0)
                .build();
            return outboxRepository.save(row).getId();
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Finance outbox serialization failed", ex);
        }
    }

    private void sendOne(FinanceSyncOutbox row) {
        if ("SENT".equals(row.getStatus())) {
            return;
        }
        Object body;
        try {
            body = objectMapper.readValue(row.getPayload(), Map.class);
        } catch (JsonProcessingException ex) {
            markFailed(row, "Invalid payload JSON");
            return;
        }
        boolean ok = financeHttpClient.postInternal(row.getTargetPath(), body);
        if (ok) {
            row.setStatus("SENT");
            row.setLastError(null);
            row.setNextRetryAt(null);
            outboxRepository.save(row);
            LogUtil.info(FinanceSyncOutboxServiceImpl.class, "Finance sync sent: key={}", row.getIdempotencyKey());
            return;
        }
        markFailed(row, "Finance service call failed");
    }

    private void markFailed(FinanceSyncOutbox row, String error) {
        int attempts = row.getAttempts() + 1;
        row.setAttempts(attempts);
        row.setStatus("FAILED");
        row.setLastError(trimError(error));
        row.setNextRetryAt(Instant.now().plusSeconds(retryDelaySeconds(attempts)));
        outboxRepository.save(row);
        LogUtil.warn(
            FinanceSyncOutboxServiceImpl.class,
            "Finance sync retry scheduled: key={}, attempts={}",
            row.getIdempotencyKey(),
            attempts
        );
    }

    private static long retryDelaySeconds(int attempts) {
        long base = 30L;
        long delay = base * (1L << Math.min(attempts - 1, 4));
        return Math.min(delay, 300L);
    }

    private static String trimError(String error) {
        if (error == null) {
            return null;
        }
        return error.length() <= 2000 ? error : error.substring(0, 2000);
    }
}
