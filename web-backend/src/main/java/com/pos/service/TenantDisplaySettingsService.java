package com.pos.service;

import com.pos.dto.tenant.TenantDisplaySettingsPayload;

public interface TenantDisplaySettingsService {

    TenantDisplaySettingsPayload getForCurrentCompany();

    TenantDisplaySettingsPayload saveForCurrentCompany(TenantDisplaySettingsPayload payload);
}
