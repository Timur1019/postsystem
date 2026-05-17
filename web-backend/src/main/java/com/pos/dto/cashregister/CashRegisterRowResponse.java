package com.pos.dto.cashregister;

public record CashRegisterRowResponse(
    Long id,
    Integer storeId,
    String storeName,
    Integer registerNumber,
    String equipmentModel,
    String equipmentSerial,
    String fiscalCardId,
    String status
) {}
