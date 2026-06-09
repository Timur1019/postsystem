package com.pos.service.report.support;

import com.pos.dto.report.sales.PeriodCompareResponse;
import com.pos.entity.Sale;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class PeriodCompareCalculator {

    private final SaleAggregateRepository saleAggregateRepository;
    private final TenantAccessSupport tenantAccess;
    private final ReportPeriodSupport periods;

    public PeriodCompareResponse compare(LocalDate from, LocalDate to, Integer storeId) {
        LocalDate end = to != null ? to : periods.today();
        LocalDate start = from != null ? from : end.minusDays(6);
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate prevEnd = start.minusDays(1);
        LocalDate prevStart = prevEnd.minusDays(days - 1);

        PeriodCompareResponse.PeriodMetrics current = loadMetrics(start, end, storeId);
        PeriodCompareResponse.PeriodMetrics previous = loadMetrics(prevStart, prevEnd, storeId);

        return new PeriodCompareResponse(
            start,
            end,
            prevStart,
            prevEnd,
            current,
            previous,
            buildDeltas(current, previous)
        );
    }

    private PeriodCompareResponse.PeriodMetrics loadMetrics(
        LocalDate from,
        LocalDate to,
        Integer storeId
    ) {
        ReportPeriodSupport.InstantRange range = periods.dayRange(from, to);
        var status = Sale.SaleStatus.COMPLETED;
        Integer companyId = tenantAccess.requireEffectiveCompanyId();

        BigDecimal revenue = nz(saleAggregateRepository.sumTotalBetween(
            range.startInclusive(), range.endExclusive(), status, storeId, companyId
        ));
        long receipts = saleAggregateRepository.countSalesBetween(
            range.startInclusive(), range.endExclusive(), status, storeId, companyId
        );
        long items = saleAggregateRepository.sumNetQuantitySoldBetween(
            range.startInclusive(), range.endExclusive(), status, storeId, companyId
        );
        return new PeriodCompareResponse.PeriodMetrics(revenue, receipts, items);
    }

    private static PeriodCompareResponse.PeriodDeltas buildDeltas(
        PeriodCompareResponse.PeriodMetrics current,
        PeriodCompareResponse.PeriodMetrics previous
    ) {
        BigDecimal revDelta = current.revenue().subtract(previous.revenue());
        long receiptDelta = current.receiptCount() - previous.receiptCount();
        long itemsDelta = current.itemsSold() - previous.itemsSold();
        return new PeriodCompareResponse.PeriodDeltas(
            revDelta,
            percentChange(previous.revenue(), current.revenue()),
            receiptDelta,
            percentChangeLong(previous.receiptCount(), current.receiptCount()),
            itemsDelta,
            percentChangeLong(previous.itemsSold(), current.itemsSold())
        );
    }

    private static BigDecimal percentChange(BigDecimal base, BigDecimal value) {
        if (base == null || base.compareTo(BigDecimal.ZERO) == 0) {
            return value != null && value.compareTo(BigDecimal.ZERO) > 0
                ? BigDecimal.valueOf(100)
                : BigDecimal.ZERO;
        }
        return value.subtract(base)
            .multiply(BigDecimal.valueOf(100))
            .divide(base, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal percentChangeLong(long base, long value) {
        return percentChange(BigDecimal.valueOf(base), BigDecimal.valueOf(value));
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
