package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.business.BusinessConfigResponse;
import com.pos.service.BusinessConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/business-config")
@RequiredArgsConstructor
@Tag(name = "Business Config", description = "Конфигурация полей товара по типу бизнеса")
@StandardApiResponses
public class BusinessConfigController {

    private final BusinessConfigService businessConfigService;

    @GetMapping
    @Operation(summary = "Конфиг по коду типа")
    public ResponseEntity<BusinessConfigResponse> byCode(@RequestParam String code) {
        return ResponseEntity.ok(businessConfigService.getByCode(code));
    }

    @GetMapping("/store/{storeId}")
    @Operation(summary = "Конфиг по магазину")
    @ApiResponse(responseCode = "200", description = "Конфигурация полей")
    public ResponseEntity<BusinessConfigResponse> forStore(@PathVariable Integer storeId) {
        return ResponseEntity.ok(businessConfigService.getForStore(storeId));
    }
}
