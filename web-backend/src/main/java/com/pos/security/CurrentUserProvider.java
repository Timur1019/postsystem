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
        return user.getRole() != null && "SUPER_ADMIN".equals(user.getRole().getName());
    }

    public boolean isTenantAdmin(User user) {
        return user.getRole() != null && "ADMIN".equals(user.getRole().getName());
    }

    public boolean isTenantAdmin() {
        return isTenantAdmin(requireCurrentUser());
    }
}
