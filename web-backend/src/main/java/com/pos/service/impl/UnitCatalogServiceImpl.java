package com.pos.service.impl;

import com.pos.domain.UnitCode;
import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;
import com.pos.entity.Unit;
import com.pos.exception.BadRequestException;
import com.pos.repository.UnitConversionRepository;
import com.pos.repository.UnitRepository;
import com.pos.service.UnitCatalogService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitCatalogServiceImpl implements UnitCatalogService {

    private final UnitRepository unitRepository;
    private final UnitConversionRepository unitConversionRepository;

    private volatile Map<String, UnitResponse> unitByCode = Map.of();

    @PostConstruct
    void warmCache() {
        refreshCache();
    }

    private void refreshCache() {
        unitByCode = unitRepository.findByEnabledTrueOrderBySortOrderAscCodeAsc().stream()
            .map(UnitCatalogServiceImpl::toResponse)
            .collect(Collectors.toMap(UnitResponse::code, Function.identity(), (a, b) -> a));
    }

    @Override
    public List<UnitResponse> listUnits(Boolean stockOnly, Boolean receiptOnly) {
        List<Unit> rows;
        if (Boolean.TRUE.equals(receiptOnly)) {
            rows = unitRepository.findByEnabledTrueAndReceiptOnlyTrueOrderBySortOrderAscCodeAsc();
        } else if (Boolean.TRUE.equals(stockOnly)) {
            rows = unitRepository.findByEnabledTrueAndStockAllowedTrueOrderBySortOrderAscCodeAsc();
        } else {
            rows = unitRepository.findByEnabledTrueOrderBySortOrderAscCodeAsc();
        }
        return rows.stream().map(UnitCatalogServiceImpl::toResponse).toList();
    }

    @Override
    public List<UnitConversionResponse> listConversions() {
        return unitConversionRepository.findAllByOrderByFromCodeAscToCodeAsc().stream()
            .map(c -> new UnitConversionResponse(c.getFromCode(), c.getToCode(), c.getFactor()))
            .toList();
    }

    @Override
    public void requireStockUnit(UnitCode unitCode) {
        if (unitCode == null) {
            throw new BadRequestException("Unit code is required");
        }
        UnitResponse unit = unitByCode.get(unitCode.name());
        if (unit == null || !unit.stockAllowed()) {
            throw new BadRequestException("Unknown or disallowed stock unit: " + unitCode);
        }
    }

    @Override
    public Optional<UnitResponse> findUnit(String code) {
        if (code == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(unitByCode.get(code.trim().toUpperCase()));
    }

    @Override
    public BigDecimal minQuantityFor(UnitCode unitCode) {
        return findUnit(unitCode != null ? unitCode.name() : null)
            .map(UnitResponse::posMinQty)
            .orElseGet(() -> UnitCode.fallbackMinQuantity(unitCode));
    }

    @Override
    public String displayLabel(UnitCode unitCode) {
        return findUnit(unitCode != null ? unitCode.name() : null)
            .map(UnitResponse::labelShortRu)
            .orElseGet(() -> unitCode != null ? unitCode.displayLabel() : UnitCode.PCS.displayLabel());
    }

    private static UnitResponse toResponse(Unit unit) {
        return new UnitResponse(
            unit.getCode(),
            unit.getCategory().name(),
            unit.getLabelRu(),
            unit.getLabelUz(),
            unit.getLabelShortRu(),
            unit.getQuantityScale(),
            unit.isAllowFraction(),
            unit.getPosMinQty(),
            unit.getPosStep(),
            unit.isStockAllowed(),
            unit.isReceiptOnly()
        );
    }
}
