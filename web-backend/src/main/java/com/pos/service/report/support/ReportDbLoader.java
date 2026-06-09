package com.pos.service.report.support;

import com.pos.dto.report.CashierStat;
import com.pos.dto.report.DailyPoint;
import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.entity.Sale;
import com.pos.mapper.ReportMapper;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.service.analytics.ReportAnalyticsReadSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReportDbLoader {

    private final SaleAggregateRepository saleAggregateRepository;
    private final ReportMapper reportMapper;
    private final TenantAccessSupport tenantAccess;
    private final ReportPeriodSupport periods;

    public DailySummaryResponse dailySummary(LocalDate date) {
        ZoneId z = periods.zone();
        var start = date.atStartOfDay(z).toInstant();
        var end = date.plusDays(1).atStartOfDay(z).toInstant();
        var status = Sale.SaleStatus.COMPLETED;
        Integer companyId = tenantAccess.requireEffectiveCompanyId();

        BigDecimal revenue = saleAggregateRepository.sumTotalBetween(start, end, status, null, companyId);
        long transactions = saleAggregateRepository.countSalesBetween(start, end, status, null, companyId);
        long itemsSold = saleAggregateRepository.sumQuantitySoldBetween(start, end, status, null, companyId);
        BigDecimal cost = saleAggregateRepository.sumCostEstimateBetween(start, end, null, companyId);

        return ReportAnalyticsReadSupport.toDailySummary(
            revenue != null ? revenue : BigDecimal.ZERO,
            transactions,
            itemsSold,
            cost
        );
    }

    public SalesReportResponse salesReport(LocalDate from, LocalDate to) {
        ZoneId z = periods.zone();
        ReportPeriodSupport.InstantRange range = periods.dayRange(from, to);
        var status = Sale.SaleStatus.COMPLETED;
        Integer companyId = tenantAccess.requireEffectiveCompanyId();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        List<DailyPoint> breakdown = new ArrayList<>();

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            var start = d.atStartOfDay(z).toInstant();
            var end = d.plusDays(1).atStartOfDay(z).toInstant();
            BigDecimal rev = saleAggregateRepository.sumTotalBetween(start, end, status, null, companyId);
            if (rev == null) {
                rev = BigDecimal.ZERO;
            }
            totalRevenue = totalRevenue.add(rev);
            breakdown.add(new DailyPoint(d.toString(), rev));
        }

        long transactions = saleAggregateRepository.countSalesBetween(
            range.startInclusive(), range.endExclusive(), status, null, companyId
        );
        long itemsSold = saleAggregateRepository.sumQuantitySoldBetween(
            range.startInclusive(), range.endExclusive(), status, null, companyId
        );
        BigDecimal cost = saleAggregateRepository.sumCostEstimateBetween(
            range.startInclusive(), range.endExclusive(), null, companyId
        );
        BigDecimal costSafe = cost != null ? cost : BigDecimal.ZERO;
        BigDecimal profit = totalRevenue.subtract(costSafe).setScale(2, RoundingMode.HALF_UP);
        BigDecimal avg = transactions > 0
            ? totalRevenue.divide(BigDecimal.valueOf(transactions), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        LogUtil.debug(ReportDbLoader.class, "Sales report loaded from DB for {} .. {}", from, to);
        return new SalesReportResponse(totalRevenue, transactions, itemsSold, avg, costSafe, profit, breakdown);
    }

    public List<TopProductRow> topProducts(int limit, LocalDate from, LocalDate to) {
        LocalDate clampedFrom = periods.clampFrom(from);
        LocalDate clampedTo = periods.clampTo(to);
        return reportMapper.toTopProductRowList(
            saleAggregateRepository.topProductsRaw(
                clampedFrom, clampedTo, Math.max(1, limit), tenantAccess.requireEffectiveCompanyId()
            )
        );
    }

    public List<CashierStat> cashierPerformance(LocalDate from, LocalDate to) {
        LocalDate clampedFrom = periods.clampFrom(from);
        LocalDate clampedTo = periods.clampTo(to);
        return reportMapper.toCashierStatList(
            saleAggregateRepository.cashierPerformanceRaw(
                clampedFrom, clampedTo, tenantAccess.requireEffectiveCompanyId()
            )
        );
    }
}
