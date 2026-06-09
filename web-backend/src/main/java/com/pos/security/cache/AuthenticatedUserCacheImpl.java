package com.pos.security.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.pos.config.SecurityCacheProperties;
import com.pos.entity.User;
import com.pos.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class AuthenticatedUserCacheImpl implements AuthenticatedUserCache {

    private final UserRepository userRepository;
    private final Cache<UUID, User> cache;

    public AuthenticatedUserCacheImpl(UserRepository userRepository, SecurityCacheProperties properties) {
        this.userRepository = userRepository;
        this.cache = Caffeine.newBuilder()
            .maximumSize(Math.max(100, properties.getMaxSize()))
            .expireAfterWrite(Math.max(1, properties.getTtlMinutes()), TimeUnit.MINUTES)
            .recordStats()
            .build();
    }

    @Override
    public Optional<User> findById(UUID userId) {
        if (userId == null) {
            return Optional.empty();
        }
        User cached = cache.getIfPresent(userId);
        if (cached != null) {
            return Optional.of(cached);
        }
        Optional<User> loaded = userRepository.findByIdWithDetails(userId);
        loaded.ifPresent(user -> cache.put(userId, user));
        return loaded;
    }

    @Override
    public void evict(UUID userId) {
        if (userId != null) {
            cache.invalidate(userId);
        }
    }

    @Override
    public void evictAll() {
        cache.invalidateAll();
    }
}
