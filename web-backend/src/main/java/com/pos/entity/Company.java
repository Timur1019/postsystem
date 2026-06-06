package com.pos.entity;

import com.pos.domain.BusinessType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "companies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "login_code", nullable = false, length = 32)
    private String loginCode;

    @Column(name = "legal_name", length = 255)
    private String legalName;

    @Column(length = 20)
    private String tin;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false, length = 32)
    @Builder.Default
    private BusinessType businessType = BusinessType.UNIVERSAL;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
