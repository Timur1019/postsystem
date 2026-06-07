package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.cashregister.CashRegisterConfigFormOptionsResponse;
import com.pos.dto.cashregister.CashRegisterConfigRowResponse;
import com.pos.dto.cashregister.CreateCashRegisterConfigRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CashRegisterConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cash-register-configs")
@RequiredArgsConstructor
@Tag(name = "Cash Register Configs", description = "Конфигурация кассовых аппаратов")
@StandardApiResponses
public class CashRegisterConfigController {

    private final CashRegisterConfigService cashRegisterConfigService;

    @GetMapping("/form-options")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Опции формы", description = "Справочные данные для формы настройки кассы")
    @ApiResponse(responseCode = "200", description = "Опции формы")
    public ResponseEntity<CashRegisterConfigFormOptionsResponse> formOptions() {
        return ResponseEntity.ok(cashRegisterConfigService.getFormOptions());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список конфигураций", description = "Постраничный список конфигураций касс")
    @ApiResponse(responseCode = "200", description = "Список конфигураций")
    public ResponseEntity<PageResponse<CashRegisterConfigRowResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) String equipmentSerial,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(
            cashRegisterConfigService.list(search, storeId, equipmentSerial, pageable)
        );
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать конфигурацию", description = "Добавление новой конфигурации кассового аппарата")
    @ApiResponse(responseCode = "201", description = "Конфигурация создана")
    public ResponseEntity<CashRegisterConfigRowResponse> create(@Valid @RequestBody CreateCashRegisterConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cashRegisterConfigService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Обновить конфигурацию", description = "Изменение настроек кассового аппарата")
    @ApiResponse(responseCode = "200", description = "Конфигурация обновлена")
    public ResponseEntity<CashRegisterConfigRowResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody CreateCashRegisterConfigRequest request
    ) {
        return ResponseEntity.ok(cashRegisterConfigService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить конфигурацию", description = "Удаление конфигурации кассового аппарата")
    @ApiResponse(responseCode = "204", description = "Конфигурация удалена")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cashRegisterConfigService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
