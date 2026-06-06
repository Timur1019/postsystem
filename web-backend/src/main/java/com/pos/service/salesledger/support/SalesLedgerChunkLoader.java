package com.pos.service.salesledger.support;

import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import com.pos.mapper.SaleMapper;
import com.pos.repository.sale.SaleExportRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@Transactional(readOnly = true)
public class SalesLedgerChunkLoader {

    private final SaleExportRepository saleExportRepository;
    private final SaleMapper saleMapper;

    public SalesLedgerChunkLoader(SaleExportRepository saleExportRepository, SaleMapper saleMapper) {
        this.saleExportRepository = saleExportRepository;
        this.saleMapper = saleMapper;
    }

    public List<SalesLedgerEntry> loadBetween(Instant start, Instant end) {
        List<Sale> sales = saleExportRepository.findSummariesForLedgerBetween(start, end);
        return sales.stream()
            .map(this::toEntry)
            .toList();
    }

    private SalesLedgerEntry toEntry(Sale sale) {
        SaleResponse summary = saleMapper.toSummaryResponse(sale);
        return new SalesLedgerEntry(sale.getCashier().getId(), summary);
    }
}
