package com.pos.dto.tenant;

public record PrintSettingsPayload(
    Integer paperWidthMm,
    Integer contentWidthMm,
    Integer pageMarginMm,
    Integer padHorizontalMm,
    Integer padVerticalMm,
    Integer fontSizePx,
    Double lineHeight
) {}
