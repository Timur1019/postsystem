package com.pos.service;

import java.util.Map;
import java.util.UUID;

public interface ProductAttributeService {

    Map<String, String> getAttributes(UUID productId);

    void saveAttributes(UUID productId, String businessTypeCode, Map<String, String> attributes);
}
