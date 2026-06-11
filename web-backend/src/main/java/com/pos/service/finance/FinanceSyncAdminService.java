package com.pos.service.finance;

import com.pos.dto.finance.FinanceSyncOutboxDto;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface FinanceSyncAdminService {

    PageResponse<FinanceSyncOutboxDto> listOutbox(String status, Pageable pageable);

    void retryOutbox(UUID id);

    int retryPendingBatch();
}
