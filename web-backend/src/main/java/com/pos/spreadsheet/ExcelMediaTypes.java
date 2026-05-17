package com.pos.spreadsheet;

import org.springframework.http.MediaType;

public final class ExcelMediaTypes {

    public static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static final MediaType XLSX_MEDIA = MediaType.parseMediaType(XLSX);

    private ExcelMediaTypes() {
    }
}
