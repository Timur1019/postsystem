package com.pos.service;

import com.pos.dto.business.BusinessConfigResponse;

public interface BusinessConfigService {

    BusinessConfigResponse getByCode(String code);

    BusinessConfigResponse getForStore(Integer storeId);
}
