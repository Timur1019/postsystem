package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "z_reports",
    uniqueConstraints = @UniqueConstraint(columnNames = {"store_id", "z_number"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(name = "fiscal_card_id", nullable = false, length = 100)
    private String fiscalCardId;

    @Column(name = "terminal_serial", length = 100)
    private String terminalSerial;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at", nullable = false)
    private Instant closedAt;

    @Column(name = "z_number", nullable = false)
    private Integer zNumber;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "vat_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal vatAmount;

    @Column(name = "employee_name", nullable = false, length = 255)
    private String employeeName;

    @Column(name = "brand_name", length = 200)
    private String brandName;

    @Column(name = "company_name", length = 255)
    private String companyName;

    @Column(name = "company_address", columnDefinition = "TEXT")
    private String companyAddress;

    @Column(length = 32)
    private String tin;

    @Column(name = "applet_version", length = 32)
    private String appletVersion;

    @Column(name = "cash_total", precision = 18, scale = 2)
    private BigDecimal cashTotal = BigDecimal.ZERO;

    @Column(name = "card_total", precision = 18, scale = 2)
    private BigDecimal cardTotal = BigDecimal.ZERO;

    @Column(name = "returns_cash", precision = 18, scale = 2)
    private BigDecimal returnsCash = BigDecimal.ZERO;

    @Column(name = "returns_card", precision = 18, scale = 2)
    private BigDecimal returnsCard = BigDecimal.ZERO;

    @Column(name = "vat_return", precision = 18, scale = 2)
    private BigDecimal vatReturn = BigDecimal.ZERO;

    @Column(name = "sales_count")
    private Integer salesCount = 0;

    @Column(name = "returns_count")
    private Integer returnsCount = 0;

    @Column(name = "first_receipt_number", length = 50)
    private String firstReceiptNumber;

    @Column(name = "last_receipt_number", length = 50)
    private String lastReceiptNumber;

    @Column(name = "discount_total", precision = 18, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "line_discount_total", precision = 18, scale = 2)
    private BigDecimal lineDiscountTotal = BigDecimal.ZERO;

    @Column(name = "order_discount_total", precision = 18, scale = 2)
    private BigDecimal orderDiscountTotal = BigDecimal.ZERO;
}
