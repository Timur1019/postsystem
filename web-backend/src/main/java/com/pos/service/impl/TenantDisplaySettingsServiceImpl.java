package com.pos.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.tenant.TenantDisplaySettingsPayload;
import com.pos.entity.Company;
import com.pos.entity.CompanyTenantDisplaySettings;
import com.pos.exception.BadRequestException;
import com.pos.repository.CompanyTenantDisplaySettingsRepository;
import com.pos.service.TenantDisplaySettingsService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantDisplaySettingsServiceImpl implements TenantDisplaySettingsService {

    private static final int MAX_LOGO_CHARS = 750_000;

    private final CompanyTenantDisplaySettingsRepository repository;
    private final TenantAccessSupport tenantAccess;
    private final ObjectMapper objectMapper;

    @Override
    public TenantDisplaySettingsPayload getForCurrentCompany() {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return repository.findByCompanyId(companyId)
            .map(row -> toPayload(row.getSettings()))
            .orElseGet(TenantDisplaySettingsServiceImpl::emptyPayload);
    }

    @Override
    @Transactional
    public TenantDisplaySettingsPayload saveForCurrentCompany(TenantDisplaySettingsPayload payload) {
        if (payload == null) {
            throw new BadRequestException("Settings payload is required");
        }
        validateLogo(payload.systemLogoDataUrl());
        validateLogo(payload.receiptLogoDataUrl());

        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Company company = tenantAccess.requireCompany(companyId);
        JsonNode json = objectMapper.valueToTree(sanitize(payload));

        CompanyTenantDisplaySettings row = repository.findByCompanyId(companyId)
            .orElseGet(() -> {
                CompanyTenantDisplaySettings created = new CompanyTenantDisplaySettings();
                created.setCompany(company);
                return created;
            });
        row.setSettings(json);
        repository.save(row);

        LogUtil.info(
            TenantDisplaySettingsServiceImpl.class,
            "Tenant display settings saved: companyId={}",
            companyId
        );
        return toPayload(row.getSettings());
    }

    private TenantDisplaySettingsPayload sanitize(TenantDisplaySettingsPayload payload) {
        return new TenantDisplaySettingsPayload(
            trimOrNull(payload.systemLogoDataUrl()),
            payload.systemLogoSizePx(),
            trimOrNull(payload.systemAppName()),
            trimOrNull(payload.receiptLogoDataUrl()),
            payload.receiptLogoMaxHeightMm(),
            trimOrNull(payload.receiptCompanyName()),
            trimOrNull(payload.receiptCompanyAddress()),
            trimOrNull(payload.receiptCompanyPhone()),
            trimOrNull(payload.receiptStir()),
            payload.receiptFields(),
            payload.userFormFields(),
            payload.printSettings()
        );
    }

    private static void validateLogo(String dataUrl) {
        if (!StringUtils.hasText(dataUrl)) {
            return;
        }
        if (dataUrl.length() > MAX_LOGO_CHARS) {
            throw new BadRequestException("Logo image is too large (max ~512 KB)");
        }
        if (!dataUrl.startsWith("data:image/")) {
            throw new BadRequestException("Logo must be a PNG or JPG image");
        }
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private TenantDisplaySettingsPayload toPayload(JsonNode settings) {
        if (settings == null || settings.isNull()) {
            return emptyPayload();
        }
        return objectMapper.convertValue(settings, TenantDisplaySettingsPayload.class);
    }

    private static TenantDisplaySettingsPayload emptyPayload() {
        return new TenantDisplaySettingsPayload(
            null, null, null, null, null,
            null, null, null, null,
            null, null, null
        );
    }
}
