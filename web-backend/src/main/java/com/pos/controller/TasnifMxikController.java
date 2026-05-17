package com.pos.controller;

import com.pos.dto.tasnif.MxikCatalogItemDto;
import com.pos.dto.tasnif.MxikLookupDto;
import com.pos.dto.tasnif.MxikSearchResponse;
import com.pos.exception.BadRequestException;
import com.pos.service.tasnif.TasnifMxikService;
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
public class TasnifMxikController {

    private final TasnifMxikService tasnifMxikService;

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
    public ResponseEntity<MxikCatalogItemDto> detail(
        @RequestParam String mxik,
        @RequestParam(required = false) String lang
    ) {
        return ResponseEntity.ok(tasnifMxikService.getByMxik(mxik, lang));
    }

    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
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
