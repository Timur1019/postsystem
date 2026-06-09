package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "product_attributes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(ProductAttribute.ProductAttributeId.class)
public class ProductAttribute {

    @Id
    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Id
    @Column(name = "field_key", nullable = false, length = 64)
    private String fieldKey;

    @Column(name = "value_text", columnDefinition = "TEXT")
    private String valueText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ProductAttributeId implements java.io.Serializable {
        private UUID productId;
        private String fieldKey;
    }
}
