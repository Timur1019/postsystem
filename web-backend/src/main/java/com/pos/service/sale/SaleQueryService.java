package com.pos.service.sale;

import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;

public interface SaleQueryService {

    SaleResponse getSale(UUID id);

    SaleResponse getByReceiptNumber(String receiptNumber);

    PageResponse<SaleResponse> getSales(
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
    );

    PageResponse<SaleResponse> getSalesByCashier(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        String paymentMethodStr,
        String statusStr,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    );
}
