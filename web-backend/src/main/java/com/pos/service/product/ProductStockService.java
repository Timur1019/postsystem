package com.pos.service.product;

import com.pos.dto.product.ProductResponse;
import com.pos.dto.warehouse.WarehouseReceiveRequest;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProductStockService {

    ProductResponse adjustStock(UUID id, BigDecimal quantity, String movementType, String notes, Integer storeId);

    ProductResponse receiveWarehouseStock(WarehouseReceiveRequest req);
}
