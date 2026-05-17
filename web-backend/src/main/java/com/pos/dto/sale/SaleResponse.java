package com.pos.dto.sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SaleResponse(
    UUID id,
    String receiptNumber,
    String cashierName,
    Integer storeId,
    String storeName,
    String customerName,
    Instant createdAt,
    List<SaleLineDto> items,
    BigDecimal subtotal,
    BigDecimal taxTotal,
    BigDecimal discountTotal,
    BigDecimal totalAmount,
    String paymentMethod,
    String receiptType,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    String status
) {
    public record SaleLineDto(
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        BigDecimal taxAmount,
        BigDecimal lineDiscount,
        BigDecimal taxRatePercent,
        String ikpu,
        String productSku
    ) {}
}
