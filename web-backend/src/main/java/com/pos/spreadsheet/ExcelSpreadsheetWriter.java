package com.pos.spreadsheet;

import com.pos.exception.BadRequestException;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class ExcelSpreadsheetWriter {

    public byte[] write(ExcelTemplate template, List<Map<String, Object>> dataRows) {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(template.sheetName());
            CellStyle headerStyle = headerStyle(wb);

            Row header = sheet.createRow(0);
            List<ExcelColumn> columns = template.columns();
            for (int c = 0; c < columns.size(); c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(columns.get(c).header());
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            if (template.sampleRow() != null && (dataRows == null || dataRows.isEmpty())) {
                writeDataRow(sheet.createRow(rowIdx++), columns, template.sampleRow());
            }

            if (dataRows != null) {
                for (Map<String, Object> rowData : dataRows) {
                    writeDataRow(sheet.createRow(rowIdx++), columns, rowData);
                }
            }

            sheet.createFreezePane(0, 1);
            for (int c = 0; c < columns.size(); c++) {
                sheet.autoSizeColumn(c);
            }

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new BadRequestException("Не удалось сформировать Excel: " + e.getMessage());
        }
    }

    private static void writeDataRow(Row row, List<ExcelColumn> columns, Map<?, ?> values) {
        for (int c = 0; c < columns.size(); c++) {
            String key = columns.get(c).key();
            Object raw = values.get(key);
            Cell cell = row.createCell(c);
            if (raw == null) {
                cell.setBlank();
                continue;
            }
            if (raw instanceof Number n) {
                cell.setCellValue(n.doubleValue());
            } else {
                cell.setCellValue(String.valueOf(raw));
            }
        }
    }

    private static CellStyle headerStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }
}
