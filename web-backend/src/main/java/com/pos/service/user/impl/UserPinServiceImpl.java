package com.pos.service.user.impl;

import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.repository.spec.UserSpecifications;
import com.pos.service.support.UserLookupSupport;
import com.pos.service.user.UserPinService;
import com.pos.util.CashierPinUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserPinServiceImpl implements UserPinService {

    private final UserLookupSupport userLookup;

    @Value("${app.jwt.secret}")
    private String pinSecret;

    @Override
    public void applyForCreate(User user, String roleName, Integer companyId, String pin) {
        if (!"CASHIER".equalsIgnoreCase(roleName)) {
            return;
        }
        if (companyId == null) {
            throw PosExceptions.badRequest("Company is required for cashier");
        }
        user.setPinDigest(digestUniquePin(companyId, pin, null));
    }

    @Override
    public void applyForUpdate(User user, Integer companyId, String pin) {
        if (!"CASHIER".equalsIgnoreCase(user.getRole().getName())) {
            throw PosExceptions.badRequest("PIN can only be set for cashier");
        }
        if (companyId == null) {
            throw PosExceptions.badRequest("Company is required for cashier");
        }
        user.setPinDigest(digestUniquePin(companyId, pin, user.getId()));
    }

    @Override
    public void clearOnRoleChange(User user, String oldRoleName, String newRoleName, String pinFromRequest) {
        if ("CASHIER".equals(oldRoleName) && !"CASHIER".equals(newRoleName)) {
            user.setPinDigest(null);
        }
        if ("CASHIER".equals(newRoleName) && !"CASHIER".equals(oldRoleName) && !StringUtils.hasText(pinFromRequest)) {
            throw PosExceptions.badRequest("Cashier PIN is required when assigning CASHIER role");
        }
    }

    private String digestUniquePin(Integer companyId, String pin, java.util.UUID excludeUserId) {
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw PosExceptions.badRequest("Cashier PIN must be 4-6 digits");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret);
        if (userLookup.exists(
            UserSpecifications.lookup().companyId(companyId).pinDigest(digest).excludeId(excludeUserId)
        )) {
            throw PosExceptions.badRequest("PIN already used in this company");
        }
        return digest;
    }
}
