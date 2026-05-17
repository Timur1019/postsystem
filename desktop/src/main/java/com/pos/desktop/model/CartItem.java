package com.pos.desktop.model;

import lombok.Data;

@Data
public class CartItem {
    private String productId;
    private String productName;
    private double unitPrice;
    private double taxRate;
    private int    quantity;
    private double discount;
    private double taxAmount;
    private double lineTotal;
    private int    maxStock;

    public static CartItem from(Product product, int quantity) {
        CartItem item = new CartItem();
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setUnitPrice(product.getSellingPrice());
        item.setTaxRate(product.getTaxRate());
        item.setQuantity(quantity);
        item.setDiscount(0);
        item.setMaxStock(product.getStockQuantity());
        item.recalculate();
        return item;
    }

    public void recalculate() {
        double base = unitPrice * quantity - discount;
        this.taxAmount = round2(base * (taxRate / 100.0));
        this.lineTotal = round2(base + taxAmount);
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
