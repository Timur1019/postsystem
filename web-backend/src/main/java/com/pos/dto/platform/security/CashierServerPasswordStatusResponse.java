package com.pos.dto.platform.security;

public record CashierServerPasswordStatusResponse(
    boolean configured,
    String updatedAt
) {}
