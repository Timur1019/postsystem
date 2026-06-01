package com.pos.dto.tenant;

import java.util.Map;

public record TenantDisplaySettingsPayload(
    String systemLogoDataUrl,
    Integer systemLogoSizePx,
    String systemAppName,
    String receiptLogoDataUrl,
    Integer receiptLogoMaxHeightMm,
    String receiptCompanyName,
    String receiptCompanyAddress,
    String receiptCompanyPhone,
    String receiptStir,
    Map<String, Boolean> receiptFields,
    Map<String, Boolean> userFormFields,
    PrintSettingsPayload printSettings
) {}
