package com.pos.service.sale;

import com.pos.dto.sale.SaleResponse;

import java.util.UUID;

public interface SaleVoidService {

    SaleResponse voidSale(UUID id, String reason);
}
