package com.pos.finance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "company_finance_bootstrap")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyFinanceBootstrap {

    @Id
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "bootstrapped_at", nullable = false)
    private Instant bootstrappedAt;
}
