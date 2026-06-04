package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "stock_receipt_lines")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReceiptLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private StockReceipt receipt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 18, scale = 3)
    private BigDecimal quantity;

    @Column(name = "purchase_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "unit_selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitSellingPrice;

    @Column(name = "line_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal lineCost;
}
