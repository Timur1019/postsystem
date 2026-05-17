package com.pos.desktop.model;

import lombok.Data;

@Data
public class SaleItem {
    private String id;
    private String saleId;
    private String productId;
    private String productName;
    private double unitPrice;
    private int    quantity;
    private double discount;
    private double taxAmount;
    private double lineTotal;
}
