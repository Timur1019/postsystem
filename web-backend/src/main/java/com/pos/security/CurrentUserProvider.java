package com.pos.security;

import com.pos.entity.User;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user;
        }
        if (auth != null && StringUtils.hasText(auth.getName())) {
            try {
                UUID id = UUID.fromString(auth.getName());
                return userRepository.findByIdWithDetails(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
            } catch (IllegalArgumentException ignored) {
                return userRepository.findByUsernameWithDetails(auth.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
            }
        }
        throw new ResourceNotFoundException("Current user not found");
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
