package com.pos.service.salesledger;

import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

public interface SalesLedgerCacheService {

    void refresh();

    boolean isReady();

    Optional<PageResponse<SaleResponse>> trySearch(
        LocalDate from,
        LocalDate to,
        java.util.UUID cashierId,
        String search,
        String receiptNumber,
        java.util.UUID saleId,
        String cashierName,
        String paymentMethod,
        String status,
        String paymentSettlement,
        Integer storeId,
        Pageable pageable
    );

    void onSaleChanged(Sale sale);

    void onSaleRemoved(java.util.UUID saleId);
}
