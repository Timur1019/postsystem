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
@Table(name = "products")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String sku;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "cost_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "selling_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal sellingPrice;

    /** НДС по умолчанию 12 % (Узбекистан / типовой режим). */
    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate = new BigDecimal("12");

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity = 0;

    @Column(name = "low_stock_alert")
    private int lowStockAlert = 10;

    private String barcode;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_active")
    private boolean isActive = true;

    /** External / catalog product id (display in UI). */
    @Column(name = "external_product_id", length = 100)
    private String externalProductId;

    /** National classifier (e.g. Uzbekistan IKPU). */
    @Column(length = 32)
    private String ikpu;

    @Column(name = "ikpu_status", length = 30)
    private String ikpuStatus = "UNKNOWN";

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "unit_measure_code", length = 20)
    private String unitMeasureCode;

    @Column(name = "package_code", length = 20)
    private String packageCode;

    @Column(name = "sold_individually")
    private boolean soldIndividually = true;

    @Column(name = "marked_product")
    private boolean markedProduct = false;

    @Column(name = "storage_location")
    private String storageLocation;

    @Column(name = "owner_type", length = 50)
    private String ownerType;

    @Column(name = "commission_tin", length = 9)
    private String commissionTin;

    @Column(name = "commission_pinfl", length = 14)
    private String commissionPinfl;

    @BatchSize(size = 32)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductBarcode> extraBarcodes = new ArrayList<>();

    @BatchSize(size = 32)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductStorePrice> storePrices = new ArrayList<>();

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist void prePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isLowStock() {
        return stockQuantity <= lowStockAlert;
    }
}
