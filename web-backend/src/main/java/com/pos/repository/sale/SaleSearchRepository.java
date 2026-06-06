package com.pos.repository.sale;

import com.pos.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SaleSearchRepository {

    Page<Sale> searchSales(
        Instant start,
        Instant end,
        UUID cashierId,
        String receipt,
        String cashierName,
        String q,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        UUID saleId,
        String paymentSettlement,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    );

    Page<Sale> searchReturns(
        List<Sale.SaleStatus> returnStatuses,
        Instant start,
        Instant end,
        String cashierName,
        String fiscal,
        Integer storeId,
        Integer companyId,
        Pageable pageable
    );

    Page<Sale> findByCashierUsername(String username, Pageable pageable);

    Page<Sale> findByCashierUsernameAndShiftId(String username, UUID shiftId, Pageable pageable);

    Page<Sale> findByCashierUsernameExcludingShiftId(String username, UUID shiftId, Pageable pageable);

    Page<Sale> searchCashierSales(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        Sale.PaymentMethod paymentMethod,
        Sale.SaleStatus status,
        Instant dateFrom,
        Instant dateTo,
        Pageable pageable
    );
}
