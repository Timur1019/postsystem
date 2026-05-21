package com.pos.service.sale;

import com.pos.dto.sale.PartialReturnRequest;
import com.pos.dto.sale.SaleResponse;

import java.util.UUID;

public interface SalePartialReturnService {

    SaleResponse returnItems(UUID saleId, PartialReturnRequest request);
}
