package com.pos.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "supplier_payable_entries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierPayableEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private Integer companyId;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "store_id")
    private Integer storeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 32)
    private LedgerEntryType entryType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "receipt_id")
    private UUID receiptId;

    @Column(name = "expense_id")
    private UUID expenseId;

    @Column(name = "source_id", length = 64)
    private String sourceId;

    @Column(length = 1000)
    private String comment;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (transactionDate == null) {
            transactionDate = LocalDate.now();
        }
    }
}
