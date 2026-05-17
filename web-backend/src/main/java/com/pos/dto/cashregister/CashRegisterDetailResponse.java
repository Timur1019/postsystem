package com.pos.dto.cashregister;

import java.time.Instant;

public record CashRegisterDetailResponse(
    Long id,
    Integer storeId,
    String storeName,
    String storeAddress,
    Integer registerNumber,
    String equipmentModel,
    String equipmentSerial,
    String fiscalCardId,
    String status,
    Instant createdAt,
    Instant updatedAt
) {}
