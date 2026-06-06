package com.pos.repository.sale;

import com.pos.entity.Sale;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ShiftReportRepository {

    List<Object[]> aggregateShiftSales(UUID cashierId, Integer storeId, Instant from, Instant to);

    List<Object[]> aggregateByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt);

    List<Object[]> aggregateShiftBannerByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt);

    List<Object[]> aggregateShiftBannerByCashierAndTime(
        UUID cashierId,
        Integer storeId,
        Instant from,
        Instant to
    );

    List<Object[]> aggregateReturnsByShiftId(UUID shiftId, Instant periodFrom, Instant reportAt);

    List<Object[]> aggregateReturnsByCashierAndTime(
        UUID cashierId,
        Integer storeId,
        Instant periodFrom,
        Instant reportAt
    );

    List<Sale> findCompletedForZReport(Long zReportId, Sale.SaleStatus status);
}
