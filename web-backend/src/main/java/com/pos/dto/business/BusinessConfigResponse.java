package com.pos.dto.business;

import java.util.List;

public record BusinessConfigResponse(
    String businessTypeCode,
    String businessTypeName,
    List<BusinessTypeFieldResponse> fields
) {}
