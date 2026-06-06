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

    @Column(name = "clothing_size_range", length = 80)
    private String clothingSizeRange;

    @Column(name = "clothing_color", length = 50)
    private String clothingColor;

    @Column(name = "clothing_gender", length = 20)
    private String clothingGender;

    @Column(name = "pharmacy_expiry_required", nullable = false)
    @Builder.Default
    private boolean pharmacyExpiryRequired = false;

    @Column(name = "pharmacy_prescription_required", nullable = false)
    @Builder.Default
    private boolean pharmacyPrescriptionRequired = false;

    @Column(name = "pharmacy_dosage_form", length = 100)
    private String pharmacyDosageForm;
}
