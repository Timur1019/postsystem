package com.pos.service.cashier.support;

import com.pos.entity.CashierShift;
import com.pos.mapper.CashierShiftMapper;
import com.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashierShiftAggregateLoader {

    private final SaleRepository saleRepository;
    private final CashierShiftMapper cashierShiftMapper;

    public ShiftBannerAggregate loadForShift(CashierShift shift, Instant reportAt) {
        List<Object[]> rows = saleRepository.aggregateShiftBannerByShiftId(shift.getId());
        if (rows.isEmpty() || cashierShiftMapper.isEmptyBannerRow(rows.get(0))) {
            rows = saleRepository.aggregateShiftBannerByCashierAndTime(
                shift.getCashier().getId(),
                shift.getStore().getId(),
                shift.getOpenedAt(),
                reportAt
            );
        }
        if (rows.isEmpty()) {
            return ShiftBannerAggregate.empty();
        }
        return cashierShiftMapper.fromBannerRow(rows.get(0));
    }
}
