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

    public ShiftBannerAggregate loadForShift(CashierShift shift, Instant periodFrom, Instant reportAt) {
        List<Object[]> rows = saleRepository.aggregateShiftBannerByShiftId(shift.getId(), periodFrom, reportAt);
        if (rows.isEmpty() || cashierShiftMapper.isEmptyBannerRow(rows.get(0))) {
            rows = saleRepository.aggregateShiftBannerByCashierAndTime(
                shift.getCashier().getId(),
                shift.getStore().getId(),
                periodFrom,
                reportAt
            );
        }
        if (rows.isEmpty()) {
            return ShiftBannerAggregate.empty();
        }
        return cashierShiftMapper.fromBannerRow(rows.get(0));
    }

    public ShiftReturnsAggregate loadReturnsForShift(CashierShift shift, Instant periodFrom, Instant reportAt) {
        List<Object[]> rows = saleRepository.aggregateReturnsByShiftId(shift.getId(), periodFrom, reportAt);
        if (rows.isEmpty() || cashierShiftMapper.isEmptyReturnsRow(rows.get(0))) {
            rows = saleRepository.aggregateReturnsByCashierAndTime(
                shift.getCashier().getId(),
                shift.getStore().getId(),
                periodFrom,
                reportAt
            );
        }
        if (rows.isEmpty()) {
            return ShiftReturnsAggregate.empty();
        }
        return cashierShiftMapper.fromReturnsRow(rows.get(0));
    }
}
