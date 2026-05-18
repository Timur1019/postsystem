package com.pos.service.export;

import java.time.LocalDate;

public interface ReturnExportService {

    byte[] exportReturnsExcel(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Integer storeId
    );
}
