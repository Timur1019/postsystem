package com.pos.service.salesledger.support;

import com.pos.cache.salesledger.SalesLedgerEntry;
import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Sale;
import com.pos.mapper.SaleMapper;
import com.pos.repository.SaleRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@Transactional(readOnly = true)
public class SalesLedgerChunkLoader {

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;

    public SalesLedgerChunkLoader(SaleRepository saleRepository, SaleMapper saleMapper) {
        this.saleRepository = saleRepository;
        this.saleMapper = saleMapper;
    }

    public List<SalesLedgerEntry> loadBetween(Instant start, Instant end) {
        List<Sale> sales = saleRepository.findSummariesForLedgerBetween(start, end);
        return sales.stream()
            .map(this::toEntry)
            .toList();
    }

    private SalesLedgerEntry toEntry(Sale sale) {
        SaleResponse summary = saleMapper.toSummaryResponse(sale);
        return new SalesLedgerEntry(sale.getCashier().getId(), summary);
    }
}
