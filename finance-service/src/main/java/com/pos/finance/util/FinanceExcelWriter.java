package com.pos.finance.util;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public final class FinanceExcelWriter {

    private FinanceExcelWriter() {
    }

    public static byte[] write(String sheetName, List<String> headers, List<List<Object>> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                headerRow.createCell(i).setCellValue(headers.get(i));
            }
            int rowIdx = 1;
            for (List<Object> rowData : rows) {
                Row row = sheet.createRow(rowIdx++);
                for (int i = 0; i < rowData.size(); i++) {
                    Object value = rowData.get(i);
                    if (value == null) {
                        row.createCell(i).setBlank();
                    } else if (value instanceof Number number) {
                        row.createCell(i).setCellValue(number.doubleValue());
                    } else {
                        row.createCell(i).setCellValue(String.valueOf(value));
                    }
                }
            }
            for (int i = 0; i < headers.size(); i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to build Excel export", ex);
        }
    }
}
