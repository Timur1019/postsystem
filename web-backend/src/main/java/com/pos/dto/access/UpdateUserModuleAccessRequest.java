package com.pos.dto.access;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.Map;

public record UpdateUserModuleAccessRequest(
    @JsonAlias("custom_access")
    Boolean customAccess,
    Map<String, Boolean> modules
) {}
