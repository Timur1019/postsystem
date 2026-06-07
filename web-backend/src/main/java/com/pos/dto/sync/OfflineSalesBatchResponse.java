package com.pos.dto.sync;

import java.util.UUID;

public record OfflineSaleSyncResult(
    UUID clientSaleId,
    UUID serverSaleId,
    String serverReceiptNumber,
    String status,
    String errorMessage
) {}

public record OfflineSalesBatchResponse(
    java.util.List<OfflineSaleSyncResult> results
) {}
