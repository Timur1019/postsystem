package com.pos.dto.order;

import org.springframework.core.io.Resource;

public record PhotoDownload(Resource resource, String contentType) {}
