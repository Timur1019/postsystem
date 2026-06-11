package com.pos.finance.dto.category;

import java.util.UUID;

public record CategoryDto(
    UUID id,
    String name,
    boolean system,
    boolean active
) {
}
