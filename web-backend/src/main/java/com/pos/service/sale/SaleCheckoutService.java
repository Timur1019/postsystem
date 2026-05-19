package com.pos.service.sale;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.SaleResponse;

public interface SaleCheckoutService {

    SaleResponse processSale(CreateSaleRequest req, String cashierUsername);
}
