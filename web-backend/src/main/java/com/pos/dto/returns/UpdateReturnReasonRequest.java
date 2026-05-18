package com.pos.dto.returns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateReturnReasonRequest(
    @NotBlank @Size(max = 500) String reason
) {}
