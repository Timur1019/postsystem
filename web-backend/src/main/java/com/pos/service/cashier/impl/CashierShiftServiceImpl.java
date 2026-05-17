package com.pos.service.cashier.impl;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashierShift;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.SaleRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.cashier.CashierShiftService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.zreport.ZReportFromShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashierShiftServiceImpl implements CashierShiftService {

    private final CashierShiftRepository cashierShiftRepository;
    private final SaleRepository saleRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CashierSaleSupport cashierSaleSupport;
    private final ZReportFromShiftService zReportFromShiftService;

    @Override
    @Transactional
    public CashierShiftResponse getOrOpenCurrent(Integer storeId) {
        User cashier = currentUserProvider.requireCurrentUser();
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
        return cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .map(s -> toResponse(s, store.getName()))
            .orElseGet(() -> openShift(storeId));
    }

    @Override
    @Transactional
    public CashierShiftResponse openShift(Integer storeId) {
        User cashier = currentUserProvider.requireCurrentUser();
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);

        cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .ifPresent(s -> {
                throw new BadRequestException("Смена уже открыта");
            });

        CashierShift shift = CashierShift.builder()
            .cashier(cashier)
            .store(store)
            .status(CashierShift.ShiftStatus.OPEN)
            .openedAt(Instant.now())
            .saleCount(0)
            .totalAmount(BigDecimal.ZERO)
            .cashAmount(BigDecimal.ZERO)
            .cardAmount(BigDecimal.ZERO)
            .vatAmount(BigDecimal.ZERO)
            .build();
        return toResponse(cashierShiftRepository.save(shift), store.getName());
    }

    @Override
    public ShiftReportResponse buildXReport(UUID shiftId) {
        CashierShift shift = requireOwnedShift(shiftId);
        if (shift.getStatus() != CashierShift.ShiftStatus.OPEN) {
            throw new BadRequestException("X-отчёт доступен только для открытой смены");
        }
        return buildReport("X", shift, Instant.now());
    }

    @Override
    public ShiftReportResponse buildZReportPreview(UUID shiftId) {
        CashierShift shift = requireOwnedShift(shiftId);
        return buildReport("Z", shift, shift.getClosedAt() != null ? shift.getClosedAt() : Instant.now());
    }

    @Override
    @Transactional
    public CashierShiftResponse closeShift(UUID shiftId) {
        CashierShift shift = requireOwnedShift(shiftId);
        if (shift.getStatus() == CashierShift.ShiftStatus.CLOSED) {
            throw new BadRequestException("Смена уже закрыта");
        }
        ShiftReportResponse report = buildReport("Z", shift, Instant.now());
        shift.setStatus(CashierShift.ShiftStatus.CLOSED);
        shift.setClosedAt(report.reportAt());
        shift.setSaleCount(report.saleCount());
        shift.setTotalAmount(report.totalAmount());
        shift.setCashAmount(report.cashAmount());
        shift.setCardAmount(report.cardAmount());
        shift.setVatAmount(report.vatAmount());
        zReportFromShiftService.createForClosedShift(shift, report);
        CashierShift saved = cashierShiftRepository.save(shift);
        return toResponse(saved, saved.getStore().getName());
    }

    private ShiftReportResponse buildReport(String type, CashierShift shift, Instant reportAt) {
        List<Object[]> rows = saleRepository.aggregateByShiftId(shift.getId());
        if (rows.isEmpty() || isEmptyAggregate(rows.get(0))) {
            rows = saleRepository.aggregateShiftSales(
                shift.getCashier().getId(),
                shift.getStore().getId(),
                shift.getOpenedAt(),
                reportAt
            );
        }
        Object[] row = rows.isEmpty() ? new Object[6] : unwrapAggregateRow(rows.get(0));
        int saleCount = toInt(row[0]);
        BigDecimal total = toBigDecimal(row[1]);
        BigDecimal vat = toBigDecimal(row[2]);
        BigDecimal discount = toBigDecimal(row[3]);
        BigDecimal cash = toBigDecimal(row[4]);
        BigDecimal card = toBigDecimal(row[5]);

        return new ShiftReportResponse(
            type,
            shift.getId(),
            shift.getStore().getId(),
            shift.getStore().getName(),
            shift.getCashier().getFullName(),
            shift.getOpenedAt(),
            reportAt,
            saleCount,
            total,
            cash,
            card,
            vat,
            discount
        );
    }

    private CashierShift requireOwnedShift(UUID shiftId) {
        User actor = currentUserProvider.requireCurrentUser();
        CashierShift shift = cashierShiftRepository.findById(shiftId)
            .orElseThrow(() -> new ResourceNotFoundException("Смена не найдена"));
        if (!shift.getCashier().getId().equals(actor.getId())) {
            throw new BadRequestException("Доступ к смене запрещён");
        }
        return shift;
    }

    private static boolean isEmptyAggregate(Object[] raw) {
        Object[] row = unwrapAggregateRow(raw);
        return toInt(row[0]) == 0 && toBigDecimal(row[1]).signum() == 0;
    }

    private static Object[] unwrapAggregateRow(Object[] raw) {
        if (raw == null) {
            return new Object[6];
        }
        if (raw.length == 1 && raw[0] instanceof Object[] nested) {
            return nested;
        }
        return raw;
    }

    private static int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        return Integer.parseInt(value.toString());
    }

    private static BigDecimal toBigDecimal(Object value) {
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

    private static CashierShiftResponse toResponse(CashierShift shift, String storeName) {
        return new CashierShiftResponse(
            shift.getId(),
            shift.getStore().getId(),
            storeName,
            shift.getCashier().getFullName(),
            shift.getStatus().name(),
            shift.getOpenedAt(),
            shift.getClosedAt(),
            shift.getSaleCount(),
            shift.getTotalAmount(),
            shift.getCashAmount(),
            shift.getCardAmount(),
            shift.getVatAmount(),
            shift.getZReport() != null ? shift.getZReport().getId() : null
        );
    }
}
