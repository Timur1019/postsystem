package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.sync.CashierSyncBootstrapResponse;
import com.pos.dto.sync.OfflineSalesBatchRequest;
import com.pos.dto.sync.OfflineSalesBatchResponse;
import com.pos.entity.User;
import com.pos.service.sync.CashierSyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sync")
@RequiredArgsConstructor
@Tag(name = "Cashier Sync", description = "Офлайн-касса: bootstrap каталога и синхронизация продаж")
@StandardApiResponses
public class CashierSyncController {

    private final CashierSyncService cashierSyncService;

    @GetMapping("/bootstrap")
    @Operation(summary = "Bootstrap каталога", description = "Полная выгрузка категорий и активных товаров магазина для офлайн-кассы")
    @ApiResponse(responseCode = "200", description = "Snapshot каталога")
    public ResponseEntity<CashierSyncBootstrapResponse> bootstrap(
        @RequestParam Integer storeId,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(cashierSyncService.bootstrap(storeId, currentUser.getId()));
    }

    @PostMapping("/sales/batch")
    @Operation(summary = "Синхронизация офлайн-продаж", description = "Idempotent batch upload продаж с desktop-кассы")
    @ApiResponse(responseCode = "200", description = "Результаты по каждой продаже")
    public ResponseEntity<OfflineSalesBatchResponse> syncSalesBatch(
        @Valid @RequestBody OfflineSalesBatchRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(cashierSyncService.syncSalesBatch(request, currentUser.getId()));
    }
}
