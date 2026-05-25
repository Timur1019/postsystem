package com.pos.security;

import com.pos.entity.User;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public User requireCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    public boolean isSuperAdmin(User user) {
        return RoleName.SUPER_ADMIN.matches(user);
    }

    public boolean isTenantAdmin(User user) {
        return RoleName.TENANT_ADMIN.matches(user);
    }

    public boolean isTenantAdmin() {
        return isTenantAdmin(requireCurrentUser());
    }

    public boolean isManager(User user) {
        return RoleName.MANAGER.matches(user);
    }

    public boolean isCashier(User user) {
        return RoleName.CASHIER.matches(user);
    }
}
