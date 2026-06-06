package com.pos.mapper;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashierShift;
import com.pos.service.cashier.support.ShiftBannerAggregate;
import com.pos.service.cashier.support.ShiftReturnsAggregate;
import org.mapstruct.Mapper;

import java.math.BigDecimal;
import java.time.Instant;

@Mapper(config = PosMapperConfig.class)
public interface CashierShiftMapper {

    default BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    default int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    default Object[] unwrapAggregateRow(Object[] raw) {
        if (raw == null) {
            return new Object[11];
        }
        if (raw.length == 1 && raw[0] instanceof Object[] nested) {
            return nested;
        }
        return raw;
    }

    default boolean isEmptyBannerRow(Object[] raw) {
        Object[] row = unwrapAggregateRow(raw);
        return toInt(row[0]) == 0 && toBigDecimal(row[1]).signum() == 0;
    }

    default ShiftBannerAggregate fromBannerRow(Object[] raw) {
        Object[] row = unwrapAggregateRow(raw);
        return new ShiftBannerAggregate(
            toInt(row[0]),
            toBigDecimal(row[1]),
            toBigDecimal(row[2]),
            toBigDecimal(row[3]),
            toBigDecimal(row[4]),
            toBigDecimal(row[5]),
            row.length > 6 ? toBigDecimal(row[6]) : BigDecimal.ZERO,
            row.length > 7 ? toBigDecimal(row[7]) : BigDecimal.ZERO,
            row.length > 8 ? toBigDecimal(row[8]) : BigDecimal.ZERO,
            row.length > 9 ? toBigDecimal(row[9]) : BigDecimal.ZERO,
            row.length > 10 ? toBigDecimal(row[10]) : BigDecimal.ZERO
        );
    }

    default boolean isEmptyReturnsRow(Object[] raw) {
        Object[] row = unwrapAggregateRow(raw);
        return toInt(row[0]) == 0
            && toBigDecimal(row[1]).signum() == 0
            && toBigDecimal(row[2]).signum() == 0
            && toBigDecimal(row[3]).signum() == 0;
    }

    default ShiftReturnsAggregate fromReturnsRow(Object[] raw) {
        Object[] row = unwrapAggregateRow(raw);
        return new ShiftReturnsAggregate(
            toInt(row[0]),
            toBigDecimal(row[1]),
            toBigDecimal(row[2]),
            toBigDecimal(row[3]),
            row.length > 4 ? toBigDecimal(row[4]) : BigDecimal.ZERO,
            row.length > 5 ? toBigDecimal(row[5]) : BigDecimal.ZERO,
            row.length > 6 ? toBigDecimal(row[6]) : BigDecimal.ZERO
        );
    }

    default ShiftReportResponse toReport(
        String type,
        CashierShift shift,
        Instant periodFrom,
        Instant reportAt,
        ShiftBannerAggregate aggregate,
        ShiftReturnsAggregate returns
    ) {
        ShiftReturnsAggregate ret = returns != null ? returns : ShiftReturnsAggregate.empty();
        return new ShiftReportResponse(
            type,
            shift.getId(),
            shift.getStore().getId(),
            shift.getStore().getName(),
            shift.getCashier().getFullName(),
            periodFrom,
            reportAt,
            aggregate.saleCount(),
            aggregate.totalAmount(),
            aggregate.cashAmount(),
            aggregate.cardAmount(),
            aggregate.humoAmount(),
            aggregate.uzcardAmount(),
            aggregate.cashlessAmount(),
            aggregate.vatAmount(),
            aggregate.discountTotal(),
            aggregate.lineDiscountTotal(),
            aggregate.orderDiscountTotal(),
            ret.returnsCount(),
            ret.returnsCash(),
            ret.returnsCard(),
            ret.returnsHumo(),
            ret.returnsUzcard(),
            ret.returnsCashless(),
            ret.returnsVat()
        );
    }

    default CashierShiftResponse toResponse(CashierShift shift, String storeName, ShiftBannerAggregate liveAggregate) {
        int saleCount = shift.getSaleCount();
        BigDecimal totalAmount = shift.getTotalAmount();
        BigDecimal cashAmount = shift.getCashAmount();
        BigDecimal cardAmount = shift.getCardAmount();
        BigDecimal vatAmount = shift.getVatAmount();

        if (shift.getStatus() == CashierShift.ShiftStatus.OPEN && liveAggregate != null) {
            saleCount = liveAggregate.saleCount();
            totalAmount = liveAggregate.totalAmount();
            vatAmount = liveAggregate.vatAmount();
            cashAmount = liveAggregate.cashAmount();
            cardAmount = liveAggregate.cardAmount();
        }

        return new CashierShiftResponse(
            shift.getId(),
            shift.getStore().getId(),
            storeName,
            shift.getCashier().getFullName(),
            shift.getStatus().name(),
            shift.getOpenedAt(),
            shift.getClosedAt(),
            saleCount,
            totalAmount,
            cashAmount,
            cardAmount,
            vatAmount,
            shift.getZReport() != null ? shift.getZReport().getId() : null
        );
    }
}
