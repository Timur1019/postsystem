package com.pos.dto.supplier;

import java.time.Instant;
import java.util.UUID;

public record SupplierResponse(
    UUID id,
    Instant createdAt,
    String name,
    String taxId,
    String address,
    String email,
    String phone
) {}
