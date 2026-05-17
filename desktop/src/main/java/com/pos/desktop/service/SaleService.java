package com.pos.desktop.service;

import com.pos.desktop.dao.ProductDao;
import com.pos.desktop.dao.SaleDao;
import com.pos.desktop.model.CartItem;
import com.pos.desktop.model.Product;
import com.pos.desktop.model.Sale;
import com.pos.desktop.model.SaleItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class SaleService {

    private static final Logger log = LoggerFactory.getLogger(SaleService.class);
    private static final AtomicInteger SEQUENCE = new AtomicInteger(1);

    private final SaleDao saleDao = new SaleDao();
    private final ProductDao productDao = new ProductDao();

    /**
     * Process a sale from cart items.
     * All validation and stock deduction happens inside the DAO transaction.
     */
    public Sale processSale(List<CartItem> cartItems, String paymentMethod,
                            double amountTendered, String cashierId) throws SaleException {

        if (cartItems == null || cartItems.isEmpty()) {
            throw new SaleException("Cart is empty");
        }

        // Validate stock availability before creating the sale
        for (CartItem cart : cartItems) {
            try {
                Product product = productDao.findById(cart.getProductId())
                    .orElseThrow(() -> new SaleException("Product not found: " + cart.getProductName()));
                if (product.getStockQuantity() < cart.getQuantity()) {
                    throw new SaleException("Insufficient stock for: " + product.getName()
                        + " (available: " + product.getStockQuantity() + ")");
                }
            } catch (SQLException e) {
                throw new SaleException("Database error validating stock", e);
            }
        }

        // Build sale
        double subtotal = 0, taxTotal = 0, discountTotal = 0;
        List<SaleItem> items = new ArrayList<>();

        for (CartItem cart : cartItems) {
            double lineSubtotal = cart.getUnitPrice() * cart.getQuantity();
            double lineDiscount = cart.getDiscount();
            double taxable      = lineSubtotal - lineDiscount;
            double taxAmt       = taxable * (cart.getTaxRate() / 100.0);
            double lineTotal    = taxable + taxAmt;

            SaleItem item = new SaleItem();
            item.setProductId(cart.getProductId());
            item.setProductName(cart.getProductName());
            item.setUnitPrice(cart.getUnitPrice());
            item.setQuantity(cart.getQuantity());
            item.setDiscount(lineDiscount);
            item.setTaxAmount(round2(taxAmt));
            item.setLineTotal(round2(lineTotal));

            items.add(item);
            subtotal      += lineSubtotal;
            taxTotal      += taxAmt;
            discountTotal += lineDiscount;
        }

        double total  = round2(subtotal + taxTotal - discountTotal);
        double change = round2(Math.max(0, amountTendered - total));

        Sale sale = new Sale();
        sale.setReceiptNumber(generateReceiptNumber());
        sale.setCashierId(cashierId);
        sale.setItems(items);
        sale.setSubtotal(round2(subtotal));
        sale.setTaxTotal(round2(taxTotal));
        sale.setDiscountTotal(round2(discountTotal));
        sale.setTotalAmount(total);
        sale.setPaymentMethod(paymentMethod);
        sale.setAmountTendered(amountTendered);
        sale.setChangeGiven(change);

        try {
            return saleDao.saveSale(sale);
        } catch (SQLException e) {
            throw new SaleException("Failed to save sale to database", e);
        }
    }

    public SaleDao.DailySummary getDailySummary() throws SQLException {
        return saleDao.getDailySummary(LocalDate.now().toString());
    }

    public SaleDao.DailySummary getSummaryForDate(String date) throws SQLException {
        return saleDao.getDailySummary(date);
    }

    public Sale findByReceiptNumber(String receiptNumber) throws SQLException {
        return saleDao.findByReceiptNumber(receiptNumber).orElse(null);
    }

    private String generateReceiptNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "DSK-" + date + "-" + String.format("%04d", SEQUENCE.getAndIncrement());
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    // ---- Custom exception ----
    public static class SaleException extends Exception {
        public SaleException(String msg)           { super(msg); }
        public SaleException(String msg, Throwable cause) { super(msg, cause); }
    }
}
