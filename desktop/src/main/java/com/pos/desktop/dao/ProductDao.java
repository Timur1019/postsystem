package com.pos.desktop.dao;

import com.pos.desktop.model.Product;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class ProductDao {

    private final DatabaseManager db = DatabaseManager.getInstance();

    // ---- CREATE ----
    public Product create(Product product) throws SQLException {
        String sql = """
            INSERT INTO products (id, sku, name, description, category_id,
                cost_price, selling_price, tax_rate, stock_quantity, low_stock_alert, barcode, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """;
        product.setId(UUID.randomUUID().toString());

        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, product.getId());
            ps.setString(2, product.getSku());
            ps.setString(3, product.getName());
            ps.setString(4, product.getDescription());
            ps.setObject(5, product.getCategoryId());
            ps.setDouble(6, product.getCostPrice());
            ps.setDouble(7, product.getSellingPrice());
            ps.setDouble(8, product.getTaxRate());
            ps.setInt(9, product.getStockQuantity());
            ps.setInt(10, product.getLowStockAlert());
            ps.setString(11, product.getBarcode());
            ps.executeUpdate();
        }
        return product;
    }

    // ---- READ ----
    public List<Product> findAll(String search, boolean activeOnly) throws SQLException {
        String sql = """
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE (? IS NULL OR p.name LIKE ? OR p.sku LIKE ? OR p.barcode = ?)
              AND (? = 0 OR p.is_active = 1)
            ORDER BY p.name
            """;
        String like = search != null ? "%" + search + "%" : null;

        List<Product> result = new ArrayList<>();
        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, like);
            ps.setString(2, like);
            ps.setString(3, like);
            ps.setString(4, search);
            ps.setInt(5, activeOnly ? 1 : 0);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        }
        return result;
    }

    public Optional<Product> findById(String id) throws SQLException {
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?")) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(mapRow(rs)) : Optional.empty();
            }
        }
    }

    public Optional<Product> findByBarcode(String barcode) throws SQLException {
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?")) {
            ps.setString(1, barcode);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? Optional.of(mapRow(rs)) : Optional.empty();
            }
        }
    }

    public List<Product> findLowStock() throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
            "LEFT JOIN categories c ON p.category_id = c.id " +
            "WHERE p.is_active = 1 AND p.stock_quantity <= p.low_stock_alert ORDER BY p.stock_quantity";
        List<Product> result = new ArrayList<>();
        try (Statement st = db.getConnection().createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) result.add(mapRow(rs));
        }
        return result;
    }

    // ---- UPDATE ----
    public void update(Product product) throws SQLException {
        String sql = """
            UPDATE products SET name=?, description=?, category_id=?, cost_price=?,
                selling_price=?, tax_rate=?, low_stock_alert=?, barcode=?, updated_at=datetime('now')
            WHERE id=?
            """;
        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, product.getName());
            ps.setString(2, product.getDescription());
            ps.setObject(3, product.getCategoryId());
            ps.setDouble(4, product.getCostPrice());
            ps.setDouble(5, product.getSellingPrice());
            ps.setDouble(6, product.getTaxRate());
            ps.setInt(7, product.getLowStockAlert());
            ps.setString(8, product.getBarcode());
            ps.setString(9, product.getId());
            ps.executeUpdate();
        }
    }

    public void updateStock(String productId, int newQuantity) throws SQLException {
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "UPDATE products SET stock_quantity=?, updated_at=datetime('now') WHERE id=?")) {
            ps.setInt(1, newQuantity);
            ps.setString(2, productId);
            ps.executeUpdate();
        }
    }

    public void deactivate(String productId) throws SQLException {
        try (PreparedStatement ps = db.getConnection().prepareStatement(
            "UPDATE products SET is_active=0 WHERE id=?")) {
            ps.setString(1, productId);
            ps.executeUpdate();
        }
    }

    // ---- MAPPING ----
    private Product mapRow(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.setId(rs.getString("id"));
        p.setSku(rs.getString("sku"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setCategoryId(rs.getObject("category_id", Integer.class));
        p.setCategoryName(rs.getString("category_name"));
        p.setCostPrice(rs.getDouble("cost_price"));
        p.setSellingPrice(rs.getDouble("selling_price"));
        p.setTaxRate(rs.getDouble("tax_rate"));
        p.setStockQuantity(rs.getInt("stock_quantity"));
        p.setLowStockAlert(rs.getInt("low_stock_alert"));
        p.setBarcode(rs.getString("barcode"));
        p.setActive(rs.getInt("is_active") == 1);
        p.setCreatedAt(rs.getString("created_at"));
        return p;
    }
}
