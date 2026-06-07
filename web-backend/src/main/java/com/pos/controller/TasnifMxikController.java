package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.tasnif.MxikCatalogItemDto;
import com.pos.dto.tasnif.MxikLookupDto;
import com.pos.dto.tasnif.MxikSearchResponse;
import com.pos.exception.BadRequestException;
import com.pos.service.tasnif.TasnifMxikService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tasnif/mxik")
@RequiredArgsConstructor
@Tag(name = "Tasnif MXIK", description = "Справочник Tasnif: поиск и получение кодов MXIK/ИКПУ")
@StandardApiResponses
public class TasnifMxikController {

    private final TasnifMxikService tasnifMxikService;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Поиск MXIK", description = "Поиск позиций в каталоге Tasnif MXIK")
    @ApiResponse(responseCode = "200", description = "Результаты поиска")
    public ResponseEntity<MxikSearchResponse> search(
        @RequestParam String q,
        @RequestParam(required = false) String lang,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(tasnifMxikService.search(q, lang, page, size));
    }

    @GetMapping("/detail")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Детали MXIK", description = "Получение карточки товара по коду MXIK")
    @ApiResponse(responseCode = "200", description = "Данные MXIK")
    public ResponseEntity<MxikCatalogItemDto> detail(
        @RequestParam String mxik,
        @RequestParam(required = false) String lang
    ) {
        return ResponseEntity.ok(tasnifMxikService.getByMxik(mxik, lang));
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Поиск по ИКПУ/штрихкоду", description = "Получение данных MXIK по ИКПУ или штрихкоду")
    @ApiResponse(responseCode = "200", description = "Данные MXIK")
    public ResponseEntity<MxikLookupDto> lookup(
        @RequestParam(required = false) String ikpu,
        @RequestParam(required = false) String barcode,
        @RequestParam(required = false) String lang
    ) {
        if (StringUtils.hasText(barcode)) {
            return ResponseEntity.ok(tasnifMxikService.lookupByBarcode(barcode.trim(), lang));
        }
        if (StringUtils.hasText(ikpu)) {
            return ResponseEntity.ok(tasnifMxikService.lookupByIkpu(ikpu.trim(), lang));
        }
        throw new BadRequestException("Укажите ikpu или barcode");
    }
}
