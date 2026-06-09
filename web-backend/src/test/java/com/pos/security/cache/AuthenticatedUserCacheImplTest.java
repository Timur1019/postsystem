package com.pos.security.cache;

import com.pos.config.SecurityCacheProperties;
import com.pos.entity.User;
import com.pos.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticatedUserCacheImplTest {

    @Mock
    private UserRepository userRepository;

    private AuthenticatedUserCacheImpl cache;

    @BeforeEach
    void setUp() {
        SecurityCacheProperties properties = new SecurityCacheProperties();
        properties.setMaxSize(100);
        properties.setTtlMinutes(10);
        cache = new AuthenticatedUserCacheImpl(userRepository, properties);
    }

    @Test
    void findById_loadsOnceThenServesFromCache() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).username("cashier").isActive(true).build();
        when(userRepository.findByIdWithDetails(id)).thenReturn(Optional.of(user));

        assertThat(cache.findById(id)).contains(user);
        assertThat(cache.findById(id)).contains(user);

        verify(userRepository, times(1)).findByIdWithDetails(id);
    }

    @Test
    void evict_forcesReload() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).username("cashier").isActive(true).build();
        when(userRepository.findByIdWithDetails(id)).thenReturn(Optional.of(user));

        cache.findById(id);
        cache.evict(id);
        cache.findById(id);

        verify(userRepository, times(2)).findByIdWithDetails(id);
    }
}
