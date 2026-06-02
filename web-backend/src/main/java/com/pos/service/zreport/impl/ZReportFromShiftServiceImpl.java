package com.pos.service.zreport.impl;

import com.pos.dto.cashier.ShiftReportResponse;
import com.pos.entity.CashRegister;
import com.pos.entity.CashierShift;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.entity.ZReport;
import com.pos.exception.BadRequestException;
import com.pos.repository.CashRegisterRepository;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.ZReportRepository;
import com.pos.service.zreport.ZReportFromShiftService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ZReportFromShiftServiceImpl implements ZReportFromShiftService {

    private static final String DEFAULT_FISCAL_CARD = "—";
    private static final String DEFAULT_BRAND = "Tinda";

    private final ZReportRepository zReportRepository;
    private final CashRegisterRepository cashRegisterRepository;
    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;

    @Override
    public ZReport createForClosedShift(CashierShift shift, ShiftReportResponse report) {
        if (shift.getZReport() != null) {
            return shift.getZReport();
        }

        Store store = shift.getStore();
        Integer storeId = store.getId();
        int nextZ = zReportRepository.findMaxZNumberByStoreId(storeId) + 1;

        CashRegister register = cashRegisterRepository
            .findFirstByStore_IdOrderByRegisterNumberAsc(storeId)
            .orElse(null);

        String fiscalCardId = register != null && StringUtils.hasText(register.getFiscalCardId())
            ? register.getFiscalCardId().trim()
            : DEFAULT_FISCAL_CARD;
        String terminalSerial = register != null ? register.getEquipmentSerial() : null;
        String appletVersion = register != null ? register.getEquipmentModel() : null;

        Company company = store.getCompany();
        String companyName = company != null && StringUtils.hasText(company.getLegalName())
            ? company.getLegalName()
            : (company != null ? company.getName() : store.getName());
        String companyAddress = company != null && StringUtils.hasText(company.getAddress())
            ? company.getAddress()
            : store.getAddress();
        String tin = company != null ? company.getTin() : null;

        ShiftSaleBounds bounds = loadShiftBounds(shift.getId(), shift.getOpenedAt(), report.reportAt());

        BigDecimal returnsCash = bounds.returnsCash();
        BigDecimal returnsCard = bounds.returnsCard();
        BigDecimal vatReturn = bounds.returnsVat();

        ZReport zReport = ZReport.builder()
            .store(store)
            .fiscalCardId(fiscalCardId)
            .terminalSerial(terminalSerial)
            .openedAt(shift.getOpenedAt())
            .closedAt(report.reportAt())
            .zNumber(nextZ)
            .totalAmount(report.totalAmount())
            .vatAmount(report.vatAmount())
            .employeeName(report.cashierName())
            .brandName(DEFAULT_BRAND)
            .companyName(companyName)
            .companyAddress(companyAddress)
            .tin(tin)
            .appletVersion(appletVersion)
            .cashTotal(report.cashAmount())
            .cardTotal(report.cardAmount())
            .returnsCash(returnsCash)
            .returnsCard(returnsCard)
            .vatReturn(vatReturn)
            .salesCount(report.saleCount())
            .returnsCount(bounds.returnsCount())
            .firstReceiptNumber(bounds.firstReceipt())
            .lastReceiptNumber(bounds.lastReceipt())
            .discountTotal(report.discountTotal())
            .lineDiscountTotal(report.lineDiscountTotal())
            .orderDiscountTotal(report.orderDiscountTotal())
            .build();

        try {
            zReport = zReportRepository.save(zReport);
        } catch (Exception ex) {
            LogUtil.error(ZReportFromShiftServiceImpl.class, "Failed to persist Z-report for shift {}", shift.getId(), ex);
            throw new BadRequestException("Не удалось сохранить Z-отчёт: " + ex.getMessage());
        }

        shift.setZReport(zReport);
        LogUtil.info(
            ZReportFromShiftServiceImpl.class,
            "Z-report {} (#{}) created for cashier shift {}",
            zReport.getId(),
            zReport.getZNumber(),
            shift.getId()
        );
        return zReport;
    }

    @Override
    public ZReport createForOpenShiftPeriod(CashierShift shift, ShiftReportResponse report, Instant periodFrom) {
        Store store = shift.getStore();
        Integer storeId = store.getId();
        int nextZ = zReportRepository.findMaxZNumberByStoreId(storeId) + 1;

        CashRegister register = cashRegisterRepository
            .findFirstByStore_IdOrderByRegisterNumberAsc(storeId)
            .orElse(null);

        String fiscalCardId = register != null && StringUtils.hasText(register.getFiscalCardId())
            ? register.getFiscalCardId().trim()
            : DEFAULT_FISCAL_CARD;
        String terminalSerial = register != null ? register.getEquipmentSerial() : null;
        String appletVersion = register != null ? register.getEquipmentModel() : null;

        Company company = store.getCompany();
        String companyName = company != null && StringUtils.hasText(company.getLegalName())
            ? company.getLegalName()
            : (company != null ? company.getName() : store.getName());
        String companyAddress = company != null && StringUtils.hasText(company.getAddress())
            ? company.getAddress()
            : store.getAddress();
        String tin = company != null ? company.getTin() : null;

        ShiftSaleBounds bounds = loadShiftBounds(shift.getId(), periodFrom, report.reportAt());

        BigDecimal returnsCash = bounds.returnsCash();
        BigDecimal returnsCard = bounds.returnsCard();
        BigDecimal vatReturn = bounds.returnsVat();

        ZReport zReport = ZReport.builder()
            .store(store)
            .fiscalCardId(fiscalCardId)
            .terminalSerial(terminalSerial)
            .openedAt(periodFrom)
            .closedAt(report.reportAt())
            .zNumber(nextZ)
            .totalAmount(report.totalAmount())
            .vatAmount(report.vatAmount())
            .employeeName(report.cashierName())
            .brandName(DEFAULT_BRAND)
            .companyName(companyName)
            .companyAddress(companyAddress)
            .tin(tin)
            .appletVersion(appletVersion)
            .cashTotal(report.cashAmount())
            .cardTotal(report.cardAmount())
            .returnsCash(returnsCash)
            .returnsCard(returnsCard)
            .vatReturn(vatReturn)
            .salesCount(report.saleCount())
            .returnsCount(bounds.returnsCount())
            .firstReceiptNumber(bounds.firstReceipt())
            .lastReceiptNumber(bounds.lastReceipt())
            .discountTotal(report.discountTotal())
            .lineDiscountTotal(report.lineDiscountTotal())
            .orderDiscountTotal(report.orderDiscountTotal())
            .build();

        try {
            zReport = zReportRepository.save(zReport);
        } catch (Exception ex) {
            LogUtil.error(ZReportFromShiftServiceImpl.class, "Failed to persist Z-report for shift {}", shift.getId(), ex);
            throw new BadRequestException("Не удалось сохранить Z-отчёт: " + ex.getMessage());
        }

        LogUtil.info(
            ZReportFromShiftServiceImpl.class,
            "Z-report {} (#{}) created for open shift {} (period reset)",
            zReport.getId(),
            zReport.getZNumber(),
            shift.getId()
        );
        return zReport;
    }

    @Override
    public int backfillMissingForClosedShifts(Integer companyId) {
        List<CashierShift> shifts = cashierShiftRepository.findClosedWithoutZReportByCompany(
            CashierShift.ShiftStatus.CLOSED,
            companyId
        );
        int created = 0;
        for (CashierShift shift : shifts) {
            Instant closedAt = shift.getClosedAt() != null ? shift.getClosedAt() : Instant.now();
            ShiftReportResponse report = new ShiftReportResponse(
                "Z",
                shift.getId(),
                shift.getStore().getId(),
                shift.getStore().getName(),
                shift.getCashier().getFullName(),
                shift.getOpenedAt(),
                closedAt,
                shift.getSaleCount(),
                shift.getTotalAmount(),
                shift.getCashAmount(),
                shift.getCardAmount(),
                shift.getVatAmount(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
            );
            createForClosedShift(shift, report);
            cashierShiftRepository.save(shift);
            created++;
        }
        LogUtil.info(ZReportFromShiftServiceImpl.class, "Backfilled {} Z-reports for closed shifts", created);
        return created;
    }

    private ShiftSaleBounds loadShiftBounds(UUID shiftId, Instant periodFrom, Instant reportAt) {
        List<Object[]> completed = saleRepository.aggregateByShiftId(shiftId, periodFrom, reportAt);
        Object[] row = completed.isEmpty() ? new Object[8] : unwrapRow(completed.get(0));

        List<Object[]> returns = saleRepository.aggregateReturnsByShiftId(shiftId, periodFrom, reportAt);
        Object[] ret = returns.isEmpty() ? new Object[4] : unwrapRow(returns.get(0));

        return new ShiftSaleBounds(
            toStr(row[6]),
            toStr(row[7]),
            toInt(ret[0]),
            toBigDecimal(ret[2]),
            toBigDecimal(ret[3]),
            toBigDecimal(ret[1])
        );
    }

    private static Object[] unwrapRow(Object[] raw) {
        if (raw == null) {
            return new Object[0];
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

    private static String toStr(Object value) {
        return value != null ? value.toString() : null;
    }

    private record ShiftSaleBounds(
        String firstReceipt,
        String lastReceipt,
        int returnsCount,
        BigDecimal returnsVat,
        BigDecimal returnsCash,
        BigDecimal returnsCard
    ) {}
}
