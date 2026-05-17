package com.pos.desktop.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    private String  id;
    private String  sku;
    private String  name;
    private String  description;
    private Integer categoryId;
    private String  categoryName;
    private double  costPrice;
    private double  sellingPrice;
    private double  taxRate;
    private int     stockQuantity;
    private int     lowStockAlert;
    private String  barcode;
    private boolean active;
    private String  createdAt;
    private String  updatedAt;

    public boolean isLowStock() {
        return stockQuantity <= lowStockAlert;
    }
}
