package com.pos.controller;

import com.pos.dto.unit.UnitConversionResponse;
import com.pos.dto.unit.UnitResponse;
import com.pos.service.UnitCatalogService;
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
public class UnitCatalogController {

    private final UnitCatalogService unitCatalogService;

    @GetMapping
    public ResponseEntity<List<UnitResponse>> list(
        @RequestParam(required = false) Boolean stockOnly,
        @RequestParam(required = false) Boolean receiptOnly
    ) {
        return ResponseEntity.ok(unitCatalogService.listUnits(stockOnly, receiptOnly));
    }

    @GetMapping("/conversions")
    public ResponseEntity<List<UnitConversionResponse>> conversions() {
        return ResponseEntity.ok(unitCatalogService.listConversions());
    }
}
