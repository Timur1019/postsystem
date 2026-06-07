package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;
import com.pos.service.UnitCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/units")
@RequiredArgsConstructor
@Tag(name = "Unit Catalog", description = "Справочник единиц измерения и конверсий")
@StandardApiResponses
public class UnitCatalogController {

    private final UnitCatalogService unitCatalogService;

    @GetMapping
    @Operation(summary = "Список единиц измерения", description = "Получение единиц измерения с опциональными фильтрами")
    @ApiResponse(responseCode = "200", description = "Список единиц измерения")
    public ResponseEntity<List<UnitResponse>> list(
        @RequestParam(required = false) Boolean stockOnly,
        @RequestParam(required = false) Boolean receiptOnly
    ) {
        return ResponseEntity.ok(unitCatalogService.listUnits(stockOnly, receiptOnly));
    }

    @GetMapping("/conversions")
    @Operation(summary = "Конверсии единиц", description = "Справочник коэффициентов пересчёта между единицами")
    @ApiResponse(responseCode = "200", description = "Список конверсий")
    public ResponseEntity<List<UnitConversionResponse>> conversions() {
        return ResponseEntity.ok(unitCatalogService.listConversions());
    }
}
