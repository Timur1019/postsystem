package com.pos.service.product.support;

import com.pos.exception.PosExceptions;
import com.pos.repository.ProductBarcodeRepository;
import com.pos.repository.spec.ProductSpecifications;
import com.pos.service.support.ProductLookupSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductBarcodeValidator {

    private final ProductLookupSupport productLookup;
    private final ProductBarcodeRepository productBarcodeRepository;

    public void validateForCreate(
        Integer companyId,
        String primaryBarcode,
        List<String> additionalBarcodes
    ) {
        validateForUpdate(companyId, primaryBarcode, additionalBarcodes, null);
    }

    public void validateForUpdate(
        Integer companyId,
        String primaryBarcode,
        List<String> additionalBarcodes,
        UUID ignoreProductId
    ) {
        assertNoDuplicatesInRequest(additionalBarcodes, primaryBarcode);
        assertUnique(companyId, primaryBarcode, ignoreProductId);
        assertAdditionalUnique(companyId, additionalBarcodes, primaryBarcode, ignoreProductId);
    }

    public void assertNoDuplicatesInRequest(List<String> extras, String primaryBarcode) {
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        if (StringUtils.hasText(primaryBarcode)) {
            seen.add(primaryBarcode.trim());
        }
        if (extras == null) {
            return;
        }
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String barcode = raw.trim();
            if (!seen.add(barcode)) {
                throw PosExceptions.badRequest("Duplicate barcode in request: " + barcode);
            }
        }
    }

    public void assertUnique(Integer companyId, String barcode, UUID ignoreProductId) {
        if (!StringUtils.hasText(barcode) || companyId == null) {
            return;
        }
        String normalized = barcode.trim();
        productLookup.findOne(ProductSpecifications.lookup(companyId).barcode(normalized).anyActiveState())
            .filter(product -> ignoreProductId == null || !product.getId().equals(ignoreProductId))
            .ifPresent(product -> {
                throw PosExceptions.badRequest("Barcode already in use: " + normalized, "barcode", normalized);
            });
        productBarcodeRepository.findByBarcodeAndProductCompanyId(normalized, companyId)
            .filter(line -> ignoreProductId == null || !line.getProduct().getId().equals(ignoreProductId))
            .ifPresent(line -> {
                throw PosExceptions.badRequest("Barcode already in use: " + normalized, "barcode", normalized);
            });
    }

    private void assertAdditionalUnique(
        Integer companyId,
        List<String> extras,
        String primaryBarcode,
        UUID ignoreProductId
    ) {
        if (extras == null) {
            return;
        }
        for (String raw : extras) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String barcode = raw.trim();
            if (StringUtils.hasText(primaryBarcode) && primaryBarcode.trim().equals(barcode)) {
                continue;
            }
            assertUnique(companyId, barcode, ignoreProductId);
        }
    }
}
