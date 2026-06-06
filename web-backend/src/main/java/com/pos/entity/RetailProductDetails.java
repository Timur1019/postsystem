package com.pos.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "retail_product_details")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetailProductDetails {

    @Id
    private UUID productId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "marked_product", nullable = false)
    @Builder.Default
    private boolean markedProduct = false;

    @Column(name = "sold_individually", nullable = false)
    @Builder.Default
    private boolean soldIndividually = true;
}
