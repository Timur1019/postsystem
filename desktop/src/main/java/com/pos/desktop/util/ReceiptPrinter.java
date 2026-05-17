package com.pos.desktop.util;

import com.pos.desktop.model.Sale;
import com.pos.desktop.model.SaleItem;

import java.awt.print.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Handles receipt generation and printing for the desktop POS.
 * Generates text receipts and supports Java AWT printing.
 */
public class ReceiptPrinter {

    private static final int RECEIPT_WIDTH = 40;
    private static final String LINE   = "-".repeat(RECEIPT_WIDTH);
    private static final String DASHED = "- ".repeat(RECEIPT_WIDTH / 2);

    public static String buildReceiptText(Sale sale) {
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append(center("RETAILPOS")).append("\n");
        sb.append(center("Nairobi, Kenya")).append("\n");
        sb.append(center("Tel: +254 700 000 000")).append("\n");
        sb.append(LINE).append("\n");

        // Meta
        sb.append(row("Receipt #:", sale.getReceiptNumber()));
        sb.append(row("Date:", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))));
        sb.append(row("Payment:", sale.getPaymentMethod()));
        sb.append(LINE).append("\n");

        // Column headers
        sb.append(String.format("%-18s %4s %8s %8s%n", "Item", "Qty", "Price", "Total"));
        sb.append(LINE).append("\n");

        // Items
        for (SaleItem item : sale.getItems()) {
            String name  = truncate(item.getProductName(), 18);
            sb.append(String.format("%-18s %4d %8s %8s%n",
                name,
                item.getQuantity(),
                CurrencyUtil.format(item.getUnitPrice()),
                CurrencyUtil.format(item.getLineTotal())
            ));
        }

        sb.append(LINE).append("\n");

        // Totals
        sb.append(row("Subtotal:", CurrencyUtil.format(sale.getSubtotal())));
        if (sale.getDiscountTotal() > 0)
            sb.append(row("Discount:", "-" + CurrencyUtil.format(sale.getDiscountTotal())));
        sb.append(row("VAT:", CurrencyUtil.format(sale.getTaxTotal())));
        sb.append(LINE).append("\n");
        sb.append(row("TOTAL:", CurrencyUtil.format(sale.getTotalAmount())));
        sb.append(row("Tendered:", CurrencyUtil.format(sale.getAmountTendered())));
        if (sale.getChangeGiven() > 0)
            sb.append(row("Change:", CurrencyUtil.format(sale.getChangeGiven())));

        sb.append(LINE).append("\n");
        sb.append(center("Thank you for your purchase!")).append("\n");
        sb.append(center("Goods returnable within 7 days")).append("\n");
        sb.append(center("with receipt.")).append("\n");

        return sb.toString();
    }

    /**
     * Sends the receipt to the default system printer.
     * Falls back to a dialog if no printer is available.
     */
    public static void print(Sale sale) {
        String text = buildReceiptText(sale);

        PrinterJob job = PrinterJob.getPrinterJob();
        job.setJobName("Receipt " + sale.getReceiptNumber());

        job.setPrintable((graphics, pageFormat, pageIndex) -> {
            if (pageIndex > 0) return Printable.NO_SUCH_PAGE;

            graphics.setFont(new java.awt.Font("Courier New", java.awt.Font.PLAIN, 10));
            java.awt.FontMetrics fm = graphics.getFontMetrics();
            int lineHeight = fm.getHeight();

            double x = pageFormat.getImageableX();
            double y = pageFormat.getImageableY() + lineHeight;

            for (String line : text.split("\n")) {
                graphics.drawString(line, (int) x, (int) y);
                y += lineHeight;
            }
            return Printable.PAGE_EXISTS;
        });

        try {
            if (job.printDialog()) {
                job.print();
            }
        } catch (PrinterException e) {
            AlertUtil.error("Print Error", "Failed to print receipt: " + e.getMessage());
        }
    }

    // ---- Helpers ----
    private static String center(String s) {
        int pad = Math.max(0, (RECEIPT_WIDTH - s.length()) / 2);
        return " ".repeat(pad) + s;
    }

    private static String row(String label, String value) {
        int gap = RECEIPT_WIDTH - label.length() - value.length();
        return label + " ".repeat(Math.max(1, gap)) + value + "\n";
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
