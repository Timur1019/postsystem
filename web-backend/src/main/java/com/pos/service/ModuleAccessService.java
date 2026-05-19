package com.pos.service;

import com.pos.dto.access.AdminModuleCatalogItem;
import com.pos.dto.access.UpdateUserModuleAccessRequest;
import com.pos.dto.access.UserModuleAccessDetailResponse;
import com.pos.dto.access.UserModuleAccessSummary;
import com.pos.entity.User;

import java.util.List;
import java.util.UUID;

public interface ModuleAccessService {

    List<AdminModuleCatalogItem> catalog();

    List<UserModuleAccessSummary> listUsers(Integer companyId);

    UserModuleAccessDetailResponse getUserAccess(UUID userId);

    UserModuleAccessDetailResponse updateUserAccess(UUID userId, UpdateUserModuleAccessRequest request);

    UserModuleAccessDetailResponse resetUserAccess(UUID userId);

    List<String> resolveAllowedModuleIds(User user);
}
