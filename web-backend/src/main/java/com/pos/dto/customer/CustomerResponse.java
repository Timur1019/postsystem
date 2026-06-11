package com.pos.dto.customer;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
    UUID id,
    Instant createdAt,
    String name,
    String phone,
    String email,
    int loyaltyPts
) {}
