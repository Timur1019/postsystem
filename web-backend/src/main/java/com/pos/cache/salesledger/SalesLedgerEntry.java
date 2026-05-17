package com.pos.cache.salesledger;

import com.pos.dto.sale.SaleResponse;

import java.util.UUID;

/** Запись журнала: DTO для API + поля для фильтрации в памяти. */
public record SalesLedgerEntry(
    UUID cashierId,
    SaleResponse sale
) {
}
