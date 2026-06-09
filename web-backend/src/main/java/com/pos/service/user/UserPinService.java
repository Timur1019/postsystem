package com.pos.service.user;

import com.pos.entity.User;

public interface UserPinService {

    void applyForCreate(User user, String roleName, Integer companyId, String pin);

    void applyForUpdate(User user, Integer companyId, String pin);

    void clearOnRoleChange(User user, String oldRoleName, String newRoleName, String pinFromRequest);
}
