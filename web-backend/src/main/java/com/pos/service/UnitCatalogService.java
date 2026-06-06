package com.pos.service;

import com.pos.domain.UnitCode;
import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface UnitCatalogService {

    List<UnitResponse> listUnits(Boolean stockOnly, Boolean receiptOnly);

    List<UnitConversionResponse> listConversions();

    void requireStockUnit(UnitCode unitCode);

    Optional<UnitResponse> findUnit(String code);

    BigDecimal minQuantityFor(UnitCode unitCode);

    String displayLabel(UnitCode unitCode);
}
