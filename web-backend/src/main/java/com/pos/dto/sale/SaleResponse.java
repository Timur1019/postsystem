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
    BigDecimal lineDiscountTotal,
    BigDecimal orderDiscountAmount,
    BigDecimal orderDiscountPercent,
    BigDecimal totalAmount,
    /** Сумма возврата (для VOIDED / REFUNDED — равна сумме чека). */
    BigDecimal returnAmount,
    String paymentMethod,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    String receiptType,
    BigDecimal amountTendered,
    BigDecimal changeGiven,
    String status,
    /** Смена кассира, в которой оформлен чек (для журнала продаж и передачи кассы). */
    UUID shiftId,
    Instant shiftOpenedAt,
    Instant shiftClosedAt,
    String shiftStatus,
    Long shiftZReportId
) {
    public record SaleLineDto(
        UUID id,
        String productName,
        int quantity,
        int returnedQuantity,
        int returnableQuantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        BigDecimal taxAmount,
        BigDecimal lineDiscount,
        BigDecimal taxRatePercent,
        String ikpu,
        String productSku
    ) {}
}
