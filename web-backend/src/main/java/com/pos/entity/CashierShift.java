package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cashier_shifts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashierShift {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShiftStatus status;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "sale_count", nullable = false)
    private int saleCount;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "cash_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal cashAmount;

    @Column(name = "card_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal cardAmount;

    @Column(name = "vat_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal vatAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "z_report_id")
    private ZReport zReport;

    @PrePersist
    void prePersist() {
        if (openedAt == null) {
            openedAt = Instant.now();
        }
        if (status == null) {
            status = ShiftStatus.OPEN;
        }
        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }
        if (cashAmount == null) {
            cashAmount = BigDecimal.ZERO;
        }
        if (cardAmount == null) {
            cardAmount = BigDecimal.ZERO;
        }
        if (vatAmount == null) {
            vatAmount = BigDecimal.ZERO;
        }
    }

    public enum ShiftStatus {
        OPEN,
        CLOSED
    }
}
