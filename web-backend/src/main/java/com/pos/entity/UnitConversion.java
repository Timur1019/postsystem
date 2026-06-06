package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "unit_conversions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(UnitConversion.UnitConversionId.class)
public class UnitConversion {

    @Id
    @Column(name = "from_code", length = 16)
    private String fromCode;

    @Id
    @Column(name = "to_code", length = 16)
    private String toCode;

    @Column(nullable = false, precision = 24, scale = 12)
    private BigDecimal factor;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitConversionId implements Serializable {
        private String fromCode;
        private String toCode;
    }
}
