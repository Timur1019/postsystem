package com.pos.service.finance;

import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FinanceSyncRetryScheduler {

    private final FinanceSyncOutboxService outboxService;

    @Scheduled(fixedDelayString = "${app.finance.sync-retry-ms:30000}")
    public void retryPendingFinanceSync() {
        int processed = outboxService.processPendingBatch();
        if (processed > 0) {
            LogUtil.info(FinanceSyncRetryScheduler.class, "Finance sync retry batch processed: {}", processed);
        }
    }
}
