package com.pos.entity;

import com.pos.domain.BusinessFieldType;
import jakarta.persistence.*;
import lombok.*;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "business_type_fields")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessTypeField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_type_id", nullable = false)
    private BusinessTypeDefinition businessType;

    @Column(name = "field_key", nullable = false, length = 64)
    private String fieldKey;

    @Column(nullable = false, length = 200)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 20)
    private BusinessFieldType fieldType;

    @Column(nullable = false)
    @Builder.Default
    private boolean required = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;

    @Column(length = 200)
    private String placeholder;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @Builder.Default
    private Set<FieldOption> options = new LinkedHashSet<>();
}
