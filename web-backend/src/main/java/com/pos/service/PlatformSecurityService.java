package com.pos.service;

import com.pos.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.dto.platform.security.UpdatePlatformSuperAdminRequest;
import com.pos.dto.platform.security.VerifyCashierServerPasswordResponse;

import java.util.List;
import java.util.UUID;

public interface PlatformSecurityService {

    CashierServerPasswordStatusResponse getCashierServerPasswordStatus();

    CashierServerPasswordStatusResponse updateCashierServerPassword(UpdateCashierServerPasswordRequest request);

    VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password);

    List<PlatformSuperAdminResponse> listSuperAdmins();

    PlatformSuperAdminResponse createSuperAdmin(CreatePlatformSuperAdminRequest request);

    PlatformSuperAdminResponse updateSuperAdmin(UUID id, UpdatePlatformSuperAdminRequest request);
}
