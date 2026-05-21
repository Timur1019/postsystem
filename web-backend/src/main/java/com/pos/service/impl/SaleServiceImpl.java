package com.pos.service.impl;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.PartialReturnRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.SaleService;
import com.pos.service.export.SaleExportService;
import com.pos.service.sale.SaleCheckoutService;
import com.pos.service.sale.SaleQueryService;
import com.pos.service.sale.SalePartialReturnService;
import com.pos.service.sale.SaleVoidService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Фасад {@link SaleService}: делегирует оформление, чтение и возврат отдельным сервисам.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleServiceImpl implements SaleService {

    private final SaleCheckoutService checkoutService;
    private final SaleQueryService queryService;
    private final SaleVoidService voidService;
    private final SalePartialReturnService partialReturnService;
    private final SaleExportService saleExportService;

    @Override
    @Transactional
    public SaleResponse processSale(CreateSaleRequest req, String cashierUsername) {
        return checkoutService.processSale(req, cashierUsername);
    }

    @Override
    public SaleResponse getSale(UUID id) {
        return queryService.getSale(id);
    }

    @Override
    public SaleResponse getByReceiptNumber(String receiptNumber) {
        return queryService.getByReceiptNumber(receiptNumber);
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
        return queryService.getSales(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr, pageable
        );
    }

    @Override
    public PageResponse<SaleResponse> getSalesByCashier(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        String paymentMethodStr,
        String statusStr,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        return queryService.getSalesByCashier(
            username, shiftId, excludeShiftId, receiptNumber,
            paymentMethodStr, statusStr, from, to, pageable
        );
    }

    @Override
    @Transactional
    public SaleResponse voidSale(UUID id, String reason) {
        return voidService.voidSale(id, reason);
    }

    @Override
    @Transactional
    public SaleResponse returnItems(UUID id, PartialReturnRequest request) {
        return partialReturnService.returnItems(id, request);
    }

    @Override
    public byte[] exportSoldLinesExcel(
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
        String storeIdStr
    ) {
        return saleExportService.exportSoldLinesExcel(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr
        );
    }
}
