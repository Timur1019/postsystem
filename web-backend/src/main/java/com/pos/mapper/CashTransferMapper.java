package com.pos.mapper;

import com.pos.dto.cashregister.CashTransferRowResponse;
import com.pos.entity.ZReport;
import org.mapstruct.Mapper;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Mapper(config = PosMapperConfig.class)
public interface CashTransferMapper {

    default CashTransferRowResponse toRowResponse(ZReport report, Map<String, Integer> registerLookup) {
        BigDecimal cash = nz(report.getCashTotal());
        BigDecimal card = nz(report.getCardTotal());
        BigDecimal total = nz(report.getTotalAmount());
        BigDecimal nonCash = total.subtract(cash).subtract(card);
        if (nonCash.compareTo(BigDecimal.ZERO) < 0) {
            nonCash = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        } else {
            nonCash = nonCash.setScale(2, RoundingMode.HALF_UP);
        }

        int salesCount = report.getSalesCount() != null ? report.getSalesCount() : 0;
        int returnsCount = report.getReturnsCount() != null ? report.getReturnsCount() : 0;

        BigDecimal retCash = nz(report.getReturnsCash());
        BigDecimal retCard = nz(report.getReturnsCard());
        BigDecimal retNonCash = nz(report.getVatReturn());
        BigDecimal returnsTotal = retCash.add(retCard).add(retNonCash).setScale(2, RoundingMode.HALF_UP);

        return new CashTransferRowResponse(
            report.getId(),
            report.getStore().getName(),
            resolveRegisterNumber(report, registerLookup),
            report.getOpenedAt(),
            report.getClosedAt(),
            report.getEmployeeName(),
            salesCount,
            total.setScale(2, RoundingMode.HALF_UP),
            cash,
            card,
            nonCash,
            returnsCount,
            returnsTotal,
            retCash,
            retCard,
            retNonCash
        );
    }

    private static Integer resolveRegisterNumber(ZReport report, Map<String, Integer> lookup) {
        Integer storeId = report.getStore().getId();
        if (StringUtils.hasText(report.getFiscalCardId())) {
            Integer register = lookup.get(storeId + "|F:" + report.getFiscalCardId().trim());
            if (register != null) {
                return register;
            }
        }
        if (StringUtils.hasText(report.getTerminalSerial())) {
            return lookup.get(storeId + "|S:" + report.getTerminalSerial().trim());
        }
        return null;
    }

    private static BigDecimal nz(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
