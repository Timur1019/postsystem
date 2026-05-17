package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "customer_order_photos",
    uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "slot"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerOrderPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder customerOrder;

    @Column(nullable = false)
    private int slot;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;
}
