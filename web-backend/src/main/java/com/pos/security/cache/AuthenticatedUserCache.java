package com.pos.security.cache;

import com.pos.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface AuthenticatedUserCache {

    Optional<User> findById(UUID userId);

    void evict(UUID userId);

    void evictAll();
}
