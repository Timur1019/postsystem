package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "field_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "field_id", nullable = false)
    private BusinessTypeField field;

    @Column(nullable = false, length = 100)
    private String value;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 100;
}
