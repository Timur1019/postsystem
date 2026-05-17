package com.pos.desktop.service;

import com.pos.desktop.dao.ProductDao;
import com.pos.desktop.model.Product;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public class ProductService {

    private final ProductDao productDao = new ProductDao();

    public List<Product> searchProducts(String search, boolean activeOnly) throws SQLException {
        String term = (search == null || search.isBlank()) ? null : search.trim();
        return productDao.findAll(term, activeOnly);
    }

    public Optional<Product> findByBarcode(String barcode) throws SQLException {
        return productDao.findByBarcode(barcode);
    }

    public Optional<Product> findById(String id) throws SQLException {
        return productDao.findById(id);
    }
}
