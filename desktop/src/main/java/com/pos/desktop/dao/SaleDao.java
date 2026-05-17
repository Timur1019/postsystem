package com.pos.desktop.dao;

import com.pos.desktop.model.Sale;
import com.pos.desktop.model.SaleItem;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class SaleDao {

    private final DatabaseManager db = DatabaseManager.getInstance();

    /**
     * Saves a sale with all items in a single transaction.
     */
    public Sale saveSale(Sale sale) throws SQLException {
        Connection conn = db.getConnection();
        conn.setAutoCommit(false);
        try {
            sale.setId(UUID.randomUUID().toString());

            String saleSql = """
                INSERT INTO sales (id, receipt_number, cashier_id, subtotal, tax_total,
                    discount_total, total_amount, payment_method, amount_tendered, change_given, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
            try (PreparedStatement ps = conn.prepareStatement(saleSql)) {
                ps.setString(1, sale.getId());
                ps.setString(2, sale.getReceiptNumber());
                ps.setString(3, sale.getCashierId());
                ps.setDouble(4, sale.getSubtotal());
                ps.setDouble(5, sale.getTaxTotal());
                ps.setDouble(6, sale.getDiscountTotal());
                ps.setDouble(7, sale.getTotalAmount());
                ps.setString(8, sale.getPaymentMethod());
                ps.setDouble(9, sale.getAmountTendered());
                ps.setDouble(10, sale.getChangeGiven());
                ps.setString(11, "COMPLETED");
                ps.setString(12, sale.getNotes());
                ps.executeUpdate();
            }

            // Insert items
            for (SaleItem item : sale.getItems()) {
                item.setId(UUID.randomUUID().toString());
                item.setSaleId(sale.getId());
                insertItem(conn, item);
            }

            // Update stock for each item
            for (SaleItem item : sale.getItems()) {
                conn.prepareStatement(
                    "UPDATE products SET stock_quantity = stock_quantity - " + item.getQuantity()
                    + " WHERE id = '" + item.getProductId() + "'"
                ).executeUpdate();

                // Record movement
                String movSql = "INSERT INTO stock_movements (id, product_id, movement_type, quantity, reference_id) VALUES (?,?,?,?,?)";
                try (PreparedStatement ps = conn.prepareStatement(movSql)) {
                    ps.setString(1, UUID.randomUUID().toString());
                    ps.setString(2, item.getProductId());
                    ps.setString(3, "SALE");
                    ps.setInt(4, -item.getQuantity());
                    ps.setString(5, sale.getId());
                    ps.executeUpdate();
                }
            }

            conn.commit();
            return sale;
        } catch (Exception e) {
            conn.rollback();
            throw e;
        } finally {
            conn.setAutoCommit(true);
        }
    }

    private void insertItem(Connection conn, SaleItem item) throws SQLException {
        String sql = """
            INSERT INTO sale_items (id, sale_id, product_id, product_name,
                unit_price, quantity, discount, tax_amount, line_total)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, item.getId());
            ps.setString(2, item.getSaleId());
            ps.setString(3, item.getProductId());
            ps.setString(4, item.getProductName());
            ps.setDouble(5, item.getUnitPrice());
            ps.setInt(6, item.getQuantity());
            ps.setDouble(7, item.getDiscount());
            ps.setDouble(8, item.getTaxAmount());
            ps.setDouble(9, item.getLineTotal());
            ps.executeUpdate();
        }
    }

    public Optional<Sale> findByReceiptNumber(String receiptNumber) throws SQLException {
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "SELECT * FROM sales WHERE receipt_number = ?")) {
            ps.setString(1, receiptNumber);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return Optional.empty();
                Sale sale = mapSale(rs);
                sale.setItems(findItemsBySaleId(sale.getId()));
                return Optional.of(sale);
            }
        }
    }

    public List<Sale> findByDate(String date) throws SQLException {
        String sql = "SELECT * FROM sales WHERE date(created_at) = ? ORDER BY created_at DESC";
        List<Sale> result = new ArrayList<>();
        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, date);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapSale(rs));
            }
        }
        return result;
    }

    // ---- Daily Summary ----
    public record DailySummary(double revenue, int transactions, double taxCollected) {}

    public DailySummary getDailySummary(String date) throws SQLException {
        String sql = """
            SELECT COALESCE(SUM(total_amount), 0) AS revenue,
                   COUNT(*) AS txn_count,
                   COALESCE(SUM(tax_total), 0) AS tax_collected
            FROM sales
            WHERE date(created_at) = ? AND status = 'COMPLETED'
            """;
        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, date);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new DailySummary(rs.getDouble("revenue"),
                        rs.getInt("txn_count"), rs.getDouble("tax_collected"));
                }
            }
        }
        return new DailySummary(0, 0, 0);
    }

    private List<SaleItem> findItemsBySaleId(String saleId) throws SQLException {
        List<SaleItem> items = new ArrayList<>();
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "SELECT * FROM sale_items WHERE sale_id = ?")) {
            ps.setString(1, saleId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) items.add(mapItem(rs));
            }
        }
        return items;
    }

    private Sale mapSale(ResultSet rs) throws SQLException {
        Sale s = new Sale();
        s.setId(rs.getString("id"));
        s.setReceiptNumber(rs.getString("receipt_number"));
        s.setCashierId(rs.getString("cashier_id"));
        s.setSubtotal(rs.getDouble("subtotal"));
        s.setTaxTotal(rs.getDouble("tax_total"));
        s.setDiscountTotal(rs.getDouble("discount_total"));
        s.setTotalAmount(rs.getDouble("total_amount"));
        s.setPaymentMethod(rs.getString("payment_method"));
        s.setAmountTendered(rs.getDouble("amount_tendered"));
        s.setChangeGiven(rs.getDouble("change_given"));
        s.setStatus(rs.getString("status"));
        s.setCreatedAt(rs.getString("created_at"));
        return s;
    }

    private SaleItem mapItem(ResultSet rs) throws SQLException {
        SaleItem i = new SaleItem();
        i.setId(rs.getString("id"));
        i.setSaleId(rs.getString("sale_id"));
        i.setProductId(rs.getString("product_id"));
        i.setProductName(rs.getString("product_name"));
        i.setUnitPrice(rs.getDouble("unit_price"));
        i.setQuantity(rs.getInt("quantity"));
        i.setDiscount(rs.getDouble("discount"));
        i.setTaxAmount(rs.getDouble("tax_amount"));
        i.setLineTotal(rs.getDouble("line_total"));
        return i;
    }
}
