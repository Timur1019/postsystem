package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.report.sales.CategorySalesRowResponse;
import com.pos.dto.report.sales.ProductSalesRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.stock.DeadStockRowResponse;
import com.pos.dto.report.stock.LowStockRowResponse;
import com.pos.dto.report.stock.StockBalanceRowResponse;
import com.pos.dto.report.stock.StockDashboardResponse;
import com.pos.dto.report.stock.StockMovementRowResponse;
import com.pos.dto.report.stock.StockTurnoverRowResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.StockReceipt;
import com.pos.repository.StockReceiptRepository;
import com.pos.repository.report.SalesReportRepository;
import com.pos.repository.report.StockReportRepository;
import com.pos.repository.sale.SaleAggregateRepository;
import com.pos.service.stock.StockReportService;
import com.pos.service.stock.support.StockReportRowMapper;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.TashkentPeriod;
import com.pos.util.TextUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.pos.service.stock.support.StockReportAggregateSupport.absUnits;
import static com.pos.service.stock.support.StockReportAggregateSupport.mergeDailyBreakdown;
import static com.pos.service.stock.support.StockReportAggregateSupport.nz;
import static com.pos.service.stock.support.StockReportAggregateSupport.positiveSum;
import static com.pos.service.stock.support.StockReportAggregateSupport.toBigDecimal;
import static com.pos.service.stock.support.StockReportAggregateSupport.toLong;
import static com.pos.service.stock.support.StockReportAggregateSupport.unwrapAggregateRow;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockReportServiceImpl implements StockReportService {

    private final SaleAggregateRepository saleAggregateRepository;
    private final SalesReportRepository salesReportRepository;
    private final StockReportRepository stockReportRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final StockReportRowMapper rowMapper;
    private final TenantAccessSupport tenantAccess;

    @Override
    public StockDashboardResponse dashboard(LocalDate from, LocalDate to, Integer storeId) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(from, to);

        long receivedUnits = positiveSum(
            stockReportRepository.sumQuantityByTypeBetween(
                StockMovementType.RESTOCK, range.startInclusive(), range.endExclusive(), storeId, companyId
            )
        );
        long writeOffUnits = absUnits(
            stockReportRepository.sumQuantityByTypeBetween(
                StockMovementType.WRITE_OFF, range.startInclusive(), range.endExclusive(), storeId, companyId
            )
        );
        BigDecimal receivedCost = nz(stockReportRepository.sumRestockCostBetween(
            range.startInclusive(), range.endExclusive(), storeId, companyId
        ));
        BigDecimal writeOffCost = nz(stockReportRepository.sumWriteOffCostBetween(
            range.startInclusive(), range.endExclusive(), storeId, companyId
        ));

        long soldUnits = 0;
        for (Object[] row : saleAggregateRepository.dailySoldUnitsAggregates(
            range.startInclusive(), range.endExclusive(), storeId, companyId
        )) {
            soldUnits += ((Number) row[1]).longValue();
        }

        Object[] stockTotals = unwrapAggregateRow(stockReportRepository.sumActiveStockUnitsAndCost(companyId));
        long currentUnits = toLong(stockTotals[0]);
        BigDecimal currentCost = toBigDecimal(stockTotals[1]);
        long lowStockCount = stockReportRepository.countLowStockProducts(companyId);

        return new StockDashboardResponse(
            receivedUnits,
            receivedCost,
            soldUnits,
            writeOffUnits,
            writeOffCost,
            currentUnits,
            nz(currentCost),
            lowStockCount,
            mergeDailyBreakdown(
                from,
                to,
                stockReportRepository.dailyStockMovementAggregates(
                    range.startInclusive(), range.endExclusive(), storeId, companyId
                ),
                saleAggregateRepository.dailySoldUnitsAggregates(
                    range.startInclusive(), range.endExclusive(), storeId, companyId
                )
            )
        );
    }

    @Override
    public PageResponse<ProductSalesRowResponse> productSales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<Object[]> page = salesReportRepository.productSalesPage(
            from, to, storeId, categoryId, TextUtil.normalizeSearch(search), companyId, pageable
        );
        return PageResponse.from(page.map(rowMapper::toProductSalesRow));
    }

    @Override
    public PageResponse<LowStockRowResponse> lowStock(Pageable pageable) {
        Page<Product> page = stockReportRepository.lowStockPage(
            tenantAccess.requireEffectiveCompanyId(), pageable
        );
        return PageResponse.from(page.map(rowMapper::toLowStockRow));
    }

    @Override
    public PageResponse<StockTurnoverRowResponse> turnover(
        LocalDate from,
        LocalDate to,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(from, to);
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<Object[]> page = stockReportRepository.stockTurnoverPage(
            range.startInclusive(), range.endExclusive(), categoryId, TextUtil.normalizeSearch(search), companyId, pageable
        );
        return PageResponse.from(page.map(rowMapper::toTurnoverRow));
    }

    @Override
    public PageResponse<StockMovementRowResponse> movementJournal(
        LocalDate from,
        LocalDate to,
        String movementType,
        Integer storeId,
        String search,
        Pageable pageable
    ) {
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(from, to);
        String type = StringUtils.hasText(movementType) && !"ALL".equalsIgnoreCase(movementType)
            ? movementType.trim().toUpperCase()
            : null;
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockMovement> page = stockReportRepository.findMovementJournal(
            range.startInclusive(), range.endExclusive(), type, storeId, companyId, TextUtil.normalizeSearch(search), pageable
        );
        Map<UUID, String> receiptNumbers = loadReceiptNumbers(page.getContent());
        return PageResponse.from(page.map(m -> rowMapper.toMovementRow(m, receiptNumbers)));
    }

    @Override
    public PageResponse<StockReceiptResponse> receipts(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        TashkentPeriod.InstantRange range = TashkentPeriod.dayRange(from, to);
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockReceipt> page = stockReceiptRepository.findReceiptsBetween(
            range.startInclusive(), range.endExclusive(), storeId, companyId, pageable
        );
        return PageResponse.from(page.map(rowMapper::toReceiptSummary));
    }

    @Override
    public PageResponse<CategorySalesRowResponse> categorySales(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Page<Object[]> page = salesReportRepository.categorySalesPage(
            from, to, storeId, tenantAccess.requireEffectiveCompanyId(), pageable
        );
        return PageResponse.from(page.map(rowMapper::toCategorySalesRow));
    }

    @Override
    public PageResponse<StoreSalesRowResponse> storeSales(
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        Page<Object[]> page = salesReportRepository.storeSalesPage(
            from, to, tenantAccess.requireEffectiveCompanyId(), pageable
        );
        return PageResponse.from(page.map(rowMapper::toStoreSalesRow));
    }

    @Override
    public PageResponse<DeadStockRowResponse> deadStock(
        LocalDate asOfDate,
        int daysNoSale,
        Integer categoryId,
        String search,
        Pageable pageable
    ) {
        LocalDate asOf = asOfDate != null ? asOfDate : TashkentPeriod.today();
        int days = Math.max(1, daysNoSale);
        LocalDate cutoff = asOf.minusDays(days);
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<Object[]> page = stockReportRepository.deadStockPage(
            asOf, cutoff, days, categoryId, TextUtil.normalizeSearch(search), companyId, pageable
        );
        return PageResponse.from(page.map(row -> rowMapper.toDeadStockRow(row, asOf)));
    }

    @Override
    public PageResponse<StockBalanceRowResponse> stockBalances(
        Integer categoryId,
        String search,
        boolean onlyWithStock,
        Pageable pageable
    ) {
        Page<Product> page = stockReportRepository.stockBalancesPage(
            tenantAccess.requireEffectiveCompanyId(), categoryId, TextUtil.normalizeSearch(search), onlyWithStock, pageable
        );
        return PageResponse.from(page.map(rowMapper::toBalanceRow));
    }

    private Map<UUID, String> loadReceiptNumbers(List<StockMovement> movements) {
        Set<UUID> ids = movements.stream()
            .map(StockMovement::getReferenceId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return stockReceiptRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(StockReceipt::getId, StockReceipt::getReceiptNumber));
    }
}
