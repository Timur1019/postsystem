package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_number", unique = true, nullable = false)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @BatchSize(size = 32)
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @Column(precision = 18, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "tax_total", precision = 18, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "discount_total", precision = 18, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    /** Скидки только по позициям (без скидки на чек). */
    @Column(name = "line_discount_total", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal lineDiscountTotal = BigDecimal.ZERO;

    /** Скидка на весь чек, сумма. */
    @Column(name = "order_discount_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal orderDiscountAmount = BigDecimal.ZERO;

    /** Скидка на чек, % (0–100), на момент продажи. */
    @Column(name = "order_discount_percent", precision = 5, scale = 2)
    private BigDecimal orderDiscountPercent;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(name = "receipt_type", length = 20)
    @Enumerated(EnumType.STRING)
    private ReceiptType receiptType;

    @Column(name = "card_type", length = 20)
    @Enumerated(EnumType.STRING)
    private CardType cardType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_shift_id")
    private CashierShift cashierShift;

    @Column(name = "cash_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal cashAmount = BigDecimal.ZERO;

    @Column(name = "card_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal cardAmount = BigDecimal.ZERO;

    @Column(name = "amount_tendered", precision = 18, scale = 2)
    private BigDecimal amountTendered;

    @Column(name = "change_given", precision = 18, scale = 2)
    private BigDecimal changeGiven = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private SaleStatus status = SaleStatus.COMPLETED;

    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist void prePersist() {
        this.createdAt = Instant.now();
        if (this.company == null && this.store != null && this.store.getCompany() != null) {
            this.company = this.store.getCompany();
        }
    }

    public enum PaymentMethod { CASH, CARD, MPESA, MIXED }
    public enum SaleStatus    { COMPLETED, REFUNDED, VOIDED }
    public enum ReceiptType   { SALE, ADVANCE, CREDIT }
    public enum CardType      { PERSONAL, CORPORATE, SOCIAL }
}
