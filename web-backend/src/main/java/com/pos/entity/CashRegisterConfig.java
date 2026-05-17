package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "cash_register_configs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashRegisterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String name;

    @Column(name = "locked_default", nullable = false)
    @Builder.Default
    private boolean lockedDefault = false;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "cash_register_config_stores",
        joinColumns = @JoinColumn(name = "config_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "store_id", referencedColumnName = "id")
    )
    @Builder.Default
    private Set<Store> stores = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "cash_register_config_registers",
        joinColumns = @JoinColumn(name = "config_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "cash_register_id", referencedColumnName = "id")
    )
    @Builder.Default
    private Set<CashRegister> registers = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "cash_register_config_categories",
        joinColumns = @JoinColumn(name = "config_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "category_id", referencedColumnName = "id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
