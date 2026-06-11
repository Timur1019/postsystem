package com.pos.service.finance.support;

import com.pos.service.finance.FinanceSyncOutboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FinanceIntegrationPublisher {

    private final FinanceSyncOutboxService outboxService;

    public void publishSaleIncomeAfterCommit(Map<String, Object> payload) {
        publishAfterCommit("SALE_INCOME", "/internal/finance/incomes/from-sale", "sale:" + payload.get("saleId"), payload);
    }

    public void publishPurchaseExpenseAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "PURCHASE_EXPENSE",
            "/internal/finance/expenses/from-purchase",
            "purchase:" + payload.get("receiptId"),
            payload
        );
    }

    public void publishRefundExpenseAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "REFUND_EXPENSE",
            "/internal/finance/expenses/from-refund",
            "refund:" + payload.get("returnEventId"),
            payload
        );
    }

    public void publishCreditSaleAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "CREDIT_SALE",
            "/internal/finance/receivables/from-credit-sale",
            "credit-sale:" + payload.get("saleId"),
            payload
        );
    }

    public void publishCreditPurchaseAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "CREDIT_PURCHASE",
            "/internal/finance/payables/from-credit-purchase",
            "credit-purchase:" + payload.get("receiptId"),
            payload
        );
    }

    public void publishAdvanceSaleAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "ADVANCE_SALE",
            "/internal/finance/advances/from-advance-sale",
            "advance-sale:" + payload.get("saleId"),
            payload
        );
    }

    public void publishAdvancePaymentAfterCommit(Map<String, Object> payload) {
        publishAfterCommit(
            "SALE_ADVANCE_PAYMENT",
            "/internal/finance/advances/from-sale-payment",
            "sale-advance:" + payload.get("saleId"),
            payload
        );
    }

    private void publishAfterCommit(String eventType, String path, String idempotencyKey, Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }
        UUID outboxId = outboxService.enqueue(eventType, path, idempotencyKey, payload);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            outboxService.trySend(outboxId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                outboxService.trySend(outboxId);
            }
        });
    }
}
