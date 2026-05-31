package com.pos.service.cashier.impl;

import com.pos.dto.cashier.CashierShiftResponse;
import com.pos.dto.cashier.FinalizeZReportResponse;
import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashierShift;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.CashierShiftMapper;
import com.pos.repository.CashierShiftRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.cashier.CashierShiftService;
import com.pos.service.cashier.support.CashierShiftAccessPolicy;
import com.pos.service.cashier.support.CashierShiftAggregateLoader;
import com.pos.service.cashier.support.ShiftBannerAggregate;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.zreport.ZReportFromShiftService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashierShiftServiceImpl implements CashierShiftService {

    private final CashierShiftRepository cashierShiftRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CashierSaleSupport cashierSaleSupport;
    private final ZReportFromShiftService zReportFromShiftService;
    private final CashierShiftMapper cashierShiftMapper;
    private final CashierShiftAggregateLoader aggregateLoader;
    private final CashierShiftAccessPolicy accessPolicy;

    @Override
    public CashierShiftResponse getCurrent(Integer storeId) {
        User cashier = currentUserProvider.requireCurrentUser();
        Store store = cashierSaleSupport.requireStoreForSale(cashier, storeId);
        return cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .map(shift -> toLiveResponse(shift, store.getName()))
            .orElseThrow(() -> new ResourceNotFoundException("Открытая смена не найдена"));
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

        CashierShift saved = persistNewOpenShift(cashier, store);
        LogUtil.info(
            CashierShiftServiceImpl.class,
            "Shift opened: id={}, storeId={}, cashierId={}",
            saved.getId(),
            store.getId(),
            cashier.getId()
        );
        return cashierShiftMapper.toResponse(saved, store.getName(), null);
    }

    @Override
    public ShiftReportResponse buildXReport(UUID shiftId) {
        CashierShift shift = accessPolicy.requireOwned(shiftId);
        if (shift.getStatus() != CashierShift.ShiftStatus.OPEN) {
            throw new BadRequestException("X-отчёт доступен только для открытой смены");
        }
        ShiftReportResponse report = buildReport("X", shift, Instant.now());
        LogUtil.debug(
            CashierShiftServiceImpl.class,
            "X-report built: shiftId={}, sales={}, total={}",
            shiftId,
            report.saleCount(),
            report.totalAmount()
        );
        return report;
    }

    @Override
    public ShiftReportResponse buildZReportPreview(UUID shiftId) {
        CashierShift shift = accessPolicy.requireOwned(shiftId);
        Instant reportAt = shift.getClosedAt() != null ? shift.getClosedAt() : Instant.now();
        return buildReport("Z", shift, reportAt);
    }

    @Override
    @Transactional
    public FinalizeZReportResponse finalizeZReport(UUID shiftId) {
        CashierShift shift = accessPolicy.requireOwned(shiftId);
        if (shift.getStatus() != CashierShift.ShiftStatus.OPEN) {
            throw new BadRequestException("Z-отчёт доступен только для открытой смены");
        }
        Instant reportAt = Instant.now();
        ShiftReportResponse report = buildReport("Z", shift, reportAt);
        applyCloseTotals(shift, report);
        zReportFromShiftService.createForClosedShift(shift, report);
        cashierShiftRepository.save(shift);

        CashierShift newShift = persistNewOpenShift(shift.getCashier(), shift.getStore());
        CashierShiftResponse newShiftResponse = cashierShiftMapper.toResponse(
            newShift,
            shift.getStore().getName(),
            null
        );
        LogUtil.info(
            CashierShiftServiceImpl.class,
            "Z-report finalized: closedShiftId={}, newShiftId={}, sales={}, total={}",
            shiftId,
            newShift.getId(),
            report.saleCount(),
            report.totalAmount()
        );
        return new FinalizeZReportResponse(report, newShiftResponse);
    }

    @Override
    @Transactional
    public CashierShiftResponse closeShift(UUID shiftId) {
        CashierShift shift = accessPolicy.requireOwned(shiftId);
        if (shift.getStatus() == CashierShift.ShiftStatus.CLOSED) {
            throw new BadRequestException("Смена уже закрыта");
        }
        ShiftReportResponse report = buildReport("Z", shift, Instant.now());
        applyCloseTotals(shift, report);
        zReportFromShiftService.createForClosedShift(shift, report);
        CashierShift saved = cashierShiftRepository.save(shift);
        LogUtil.info(
            CashierShiftServiceImpl.class,
            "Shift closed: id={}, storeId={}, sales={}, total={}",
            saved.getId(),
            saved.getStore().getId(),
            report.saleCount(),
            report.totalAmount()
        );
        return cashierShiftMapper.toResponse(saved, saved.getStore().getName(), null);
    }

    private ShiftReportResponse buildReport(String type, CashierShift shift, Instant reportAt) {
        ShiftBannerAggregate aggregate = aggregateLoader.loadForShift(shift, reportAt);
        return cashierShiftMapper.toReport(type, shift, reportAt, aggregate);
    }

    private CashierShiftResponse toLiveResponse(CashierShift shift, String storeName) {
        ShiftBannerAggregate live = shift.getStatus() == CashierShift.ShiftStatus.OPEN
            ? aggregateLoader.loadForShift(shift, Instant.now())
            : null;
        return cashierShiftMapper.toResponse(shift, storeName, live);
    }

    private CashierShift persistNewOpenShift(User cashier, Store store) {
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
        return cashierShiftRepository.save(shift);
    }

    private static void applyCloseTotals(CashierShift shift, ShiftReportResponse report) {
        shift.setStatus(CashierShift.ShiftStatus.CLOSED);
        shift.setClosedAt(report.reportAt());
        shift.setSaleCount(report.saleCount());
        shift.setTotalAmount(report.totalAmount());
        shift.setCashAmount(report.cashAmount());
        shift.setCardAmount(report.cardAmount());
        shift.setVatAmount(report.vatAmount());
    }
}
