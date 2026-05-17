package com.pos.service;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.zreport.ZReportDetailResponse;
import com.pos.dto.zreport.ZReportRowResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface ZReportService {

    PageResponse<ZReportRowResponse> list(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo,
        Pageable pageable
    );

    ZReportDetailResponse getDetail(Long id);

    byte[] exportListExcel(
        String employeeSearch,
        String fiscalCardId,
        String terminalSerial,
        Integer storeId,
        LocalDate closedFrom,
        LocalDate closedTo
    );

    byte[] exportSalesForZReport(Long zReportId);

    int backfillFromClosedShifts();
}
