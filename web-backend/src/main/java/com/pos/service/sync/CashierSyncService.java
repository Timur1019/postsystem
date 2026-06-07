package com.pos.service.sync;

import com.pos.dto.sync.CashierSyncBootstrapResponse;
import com.pos.dto.sync.OfflineSalesBatchRequest;
import com.pos.dto.sync.OfflineSalesBatchResponse;

import java.util.UUID;

public interface CashierSyncService {

    CashierSyncBootstrapResponse bootstrap(Integer storeId, UUID cashierId);

    OfflineSalesBatchResponse syncSalesBatch(OfflineSalesBatchRequest request, UUID cashierId);
}
