package com.pos.entity;

import com.pos.domain.UnitCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "units")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Unit {

    @Id
    @Column(length = 16)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitCategory category;

    @Column(name = "label_ru", nullable = false, length = 64)
    private String labelRu;

    @Column(name = "label_uz", length = 64)
    private String labelUz;

    @Column(name = "label_short_ru", nullable = false, length = 16)
    private String labelShortRu;

    @Column(name = "quantity_scale", nullable = false)
    @Builder.Default
    private int quantityScale = 0;

    @Column(name = "allow_fraction", nullable = false)
    @Builder.Default
    private boolean allowFraction = false;

    @Column(name = "pos_min_qty", nullable = false, precision = 18, scale = 6)
    @Builder.Default
    private BigDecimal posMinQty = BigDecimal.ONE;

    @Column(name = "pos_step", nullable = false, precision = 18, scale = 6)
    @Builder.Default
    private BigDecimal posStep = BigDecimal.ONE;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "stock_allowed", nullable = false)
    @Builder.Default
    private boolean stockAllowed = true;

    @Column(name = "receipt_only", nullable = false)
    @Builder.Default
    private boolean receiptOnly = false;
}
