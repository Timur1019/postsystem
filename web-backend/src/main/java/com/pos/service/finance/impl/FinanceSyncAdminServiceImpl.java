package com.pos.service.finance.impl;

import com.pos.dto.finance.FinanceSyncOutboxDto;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.FinanceSyncOutbox;
import com.pos.exception.PosExceptions;
import com.pos.repository.FinanceSyncOutboxRepository;
import com.pos.service.finance.FinanceSyncAdminService;
import com.pos.service.finance.FinanceSyncOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceSyncAdminServiceImpl implements FinanceSyncAdminService {

    private final FinanceSyncOutboxRepository outboxRepository;
    private final FinanceSyncOutboxService outboxService;

    @Override
    public PageResponse<FinanceSyncOutboxDto> listOutbox(String status, Pageable pageable) {
        Page<FinanceSyncOutbox> page = status == null || status.isBlank()
            ? outboxRepository.findAllByOrderByCreatedAtDesc(pageable)
            : outboxRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(), pageable);
        return PageResponse.from(page.map(this::toDto));
    }

    @Override
    @Transactional
    public void retryOutbox(UUID id) {
        FinanceSyncOutbox row = outboxRepository.findById(id)
            .orElseThrow(() -> PosExceptions.notFound("Finance sync outbox", id));
        if ("SENT".equals(row.getStatus())) {
            return;
        }
        outboxService.trySend(id);
    }

    @Override
    @Transactional
    public int retryPendingBatch() {
        return outboxService.processPendingBatch();
    }

    private FinanceSyncOutboxDto toDto(FinanceSyncOutbox row) {
        return new FinanceSyncOutboxDto(
            row.getId(),
            row.getEventType(),
            row.getTargetPath(),
            row.getIdempotencyKey(),
            row.getStatus(),
            row.getAttempts(),
            row.getLastError(),
            row.getCreatedAt(),
            row.getUpdatedAt(),
            row.getNextRetryAt()
        );
    }
}
