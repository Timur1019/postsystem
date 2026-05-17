package com.pos.desktop.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class Sale {
    private String        id;
    private String        receiptNumber;
    private String        cashierId;
    private List<SaleItem> items = new ArrayList<>();
    private double        subtotal;
    private double        taxTotal;
    private double        discountTotal;
    private double        totalAmount;
    private String        paymentMethod;
    private double        amountTendered;
    private double        changeGiven;
    private String        status;
    private String        notes;
    private String        createdAt;
}
