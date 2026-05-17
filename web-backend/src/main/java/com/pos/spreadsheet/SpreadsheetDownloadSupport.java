package com.pos.spreadsheet;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

public final class SpreadsheetDownloadSupport {

    private SpreadsheetDownloadSupport() {
    }

    public static ResponseEntity<byte[]> attachment(byte[] body, String filename) {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .header(HttpHeaders.CONTENT_TYPE, ExcelMediaTypes.XLSX)
            .body(body);
    }
}
