package com.pos.service.sale.impl;

import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Sale;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.SaleMapper;
import com.pos.repository.SaleRepository;
import com.pos.repository.sale.SaleSearchRepository;
import com.pos.repository.spec.SaleSpecifications;
import com.pos.service.sale.SaleAccessPolicy;
import com.pos.service.sale.SaleQueryService;
import com.pos.service.sale.support.ReceiptLookupSupport;
import com.pos.service.sale.support.SaleEnumParser;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.support.SalesQuerySupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleQueryServiceImpl implements SaleQueryService {

    private final SaleRepository saleRepository;
    private final SaleSearchRepository saleSearchRepository;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SaleAccessPolicy accessPolicy;
    private final TenantAccessSupport tenantAccess;

    @Override
    public SaleResponse getSale(UUID id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        accessPolicy.assertCanView(sale);
        return saleMapper.toResponse(sale);
    }

    @Override
    public SaleResponse getByReceiptNumber(String receiptNumber) {
        if (receiptNumber == null || receiptNumber.isBlank()) {
            throw new ResourceNotFoundException("Receipt not found");
        }

        Sale sale;
        Optional<String> exact = ReceiptLookupSupport.resolveExactReceiptNumber(receiptNumber);
        if (exact.isPresent()) {
            sale = saleRepository.findByReceiptNumber(exact.get())
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        } else {
            String suffix = ReceiptLookupSupport.extractNumericSuffix(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
            Integer companyId = tenantAccess.requireEffectiveCompanyId();
            sale = saleRepository
                .findByReceiptSuffixAndCompanyOrderByCreatedAtDesc(
                    companyId,
                    suffix,
                    PageRequest.of(0, 1)
                )
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        }

        accessPolicy.assertCanView(sale);
        return saleMapper.toResponse(sale);
    }

    @Override
    public PageResponse<SaleResponse> getSales(
        LocalDate from,
        LocalDate to,
        String cashierId,
        String search,
        String receiptNumber,
        String saleIdStr,
        String cashierName,
        String paymentMethodStr,
        String statusStr,
        String paymentSettlement,
        String storeIdStr,
        Pageable pageable
    ) {
        Optional<SalesQuerySupport.SalesFilter> filters = SalesQuerySupport.buildFilters(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr
        );
        if (filters.isEmpty()) {
            return PageResponse.from(Page.empty(pageable));
        }
        var f = filters.get();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();

        Page<Sale> page = saleSearchRepository.searchSales(
            f.start(), f.end(), f.cashierId(), f.receipt(), f.cashierName(), f.q(),
            f.paymentMethod(), f.status(), f.saleId(), f.paymentSettlement(), f.storeId(), companyId, pageable
        );
        return PageResponse.from(page.map(saleMapper::toSummaryResponse));
    }

    @Override
    public PageResponse<SaleResponse> getSalesByCashier(
        UUID cashierId,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        String paymentMethodStr,
        String statusStr,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        Sale.PaymentMethod paymentMethod = SaleEnumParser.paymentMethod(paymentMethodStr);
        Sale.SaleStatus status = SaleEnumParser.saleStatus(statusStr);
        String receipt = receiptNumber != null && !receiptNumber.isBlank() ? receiptNumber.trim() : null;
        ZoneId zone = ZoneId.systemDefault();
        Instant dateFrom = from != null ? from.atStartOfDay(zone).toInstant() : null;
        Instant dateTo = to != null ? to.plusDays(1).atStartOfDay(zone).toInstant() : null;

        Page<Sale> page = saleRepository.findAll(
            SaleSpecifications.cashierSalesFilter(
                cashierId,
                shiftId,
                excludeShiftId,
                receipt,
                paymentMethod,
                status,
                dateFrom,
                dateTo
            ),
            pageable
        );
        return PageResponse.from(page.map(saleMapper::toSummaryResponse));
    }
}
