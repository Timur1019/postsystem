package com.pos.dto.sale;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record PartialReturnRequest(
    String reason,
    @NotEmpty @Valid List<PartialReturnLineRequest> lines
) {}
