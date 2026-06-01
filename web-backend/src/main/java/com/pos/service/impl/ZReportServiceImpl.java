package com.pos.service.impl;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.zreport.ZReportDetailResponse;
import com.pos.dto.zreport.ZReportRowResponse;
import com.pos.entity.ZReport;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.ZReportMapper;
import com.pos.repository.ZReportRepository;
import com.pos.repository.spec.ZReportSpecifications;
import com.pos.service.ZReportService;
import com.pos.service.export.ZReportExportService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.service.zreport.ZReportFromShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZReportServiceImpl implements ZReportService {

    private static final ZoneId TZ = ZoneId.of("Asia/Tashkent");

    private final ZReportRepository zReportRepository;
    private final ZReportMapper zReportMapper;
    private final ZReportExportService zReportExportService;
    private final ZReportFromShiftService zReportFromShiftService;
    private final TenantAccessSupport tenantAccess;

    @Override
    public PageResponse<ZReportRowResponse> list(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo,
        Pageable pageable
    ) {
        Instant fromInst = toStartOfDay(closedFrom);
        Instant toInst = toEndOfDay(closedTo);
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        var spec = ZReportSpecifications.filter(
            companyId, employeeSearch, fiscalCardId, terminalSerial, storeId, fromInst, toInst
        );
        Page<ZReport> page = zReportRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(zReportMapper::toRowResponse));
    }

    @Override
    public ZReportDetailResponse getDetail(Long id) {
        return zReportMapper.toDetailResponse(require(id));
    }

    @Override
    public byte[] exportListExcel(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo
    ) {
        return zReportExportService.exportListExcel(
            employeeSearch, fiscalCardId, terminalSerial, storeId, closedFrom, closedTo
        );
    }

    @Override
    public byte[] exportSalesForZReport(Long zReportId) {
        return zReportExportService.exportSalesForZReportExcel(zReportId);
    }

    @Override
    @Transactional
    public int backfillFromClosedShifts() {
        return zReportFromShiftService.backfillMissingForClosedShifts();
    }

    private ZReport require(Long id) {
        ZReport report = zReportRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Z-report not found: " + id));
        if (report.getStore() != null) {
            tenantAccess.assertCanAccessStore(report.getStore());
        }
        return report;
    }

    private static Instant toStartOfDay(LocalDate d) {
        if (d == null) {
            return null;
        }
        return d.atStartOfDay(TZ).toInstant();
    }

    private static Instant toEndOfDay(LocalDate d) {
        if (d == null) {
            return null;
        }
        return d.plusDays(1).atStartOfDay(TZ).toInstant().minusNanos(1);
    }
}
