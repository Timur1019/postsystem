package com.pos.service.impl;

import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.mapper.UserMapper;
import com.pos.repository.UserRepository;
import com.pos.service.UserService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.security.cache.AuthenticatedUserCache;
import com.pos.service.user.impl.UserCreateHandler;
import com.pos.service.user.impl.UserUpdateHandler;
import com.pos.service.user.support.UserAccessPolicy;
import com.pos.util.DbExceptionTranslator;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TenantAccessSupport tenantAccess;
    private final UserAccessPolicy accessPolicy;
    private final UserMapper userMapper;
    private final UserCreateHandler createHandler;
    private final UserUpdateHandler updateHandler;
    private final AuthenticatedUserCache authenticatedUserCache;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        if (tenantAccess.isSuperAdmin()) {
            return userRepository.findAllWithDetails().stream()
                .filter(accessPolicy::canView)
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        }
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        return userRepository.findByCompanyIdWithDetails(companyId).stream()
            .filter(accessPolicy::canView)
            .map(userMapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return userMapper.toResponse(accessPolicy.requireAccessible(id));
    }

    @Override
    public UserResponse create(CreateUserRequest req) {
        return createHandler.create(req);
    }

    @Override
    public UserResponse update(UUID id, UpdateUserRequest req) {
        return updateHandler.update(id, req);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserResponse toggleActive(UUID id) {
        User user = accessPolicy.requireAccessible(id);
        if ("SUPER_ADMIN".equals(user.getRole().getName())) {
            throw PosExceptions.badRequest("Cannot deactivate super administrator");
        }
        user.setActive(!user.isActive());
        User saved = DbExceptionTranslator.persist(() -> userRepository.saveAndFlush(user));
        authenticatedUserCache.evict(saved.getId());
        LogUtil.info(UserServiceImpl.class, "User active toggled: id={}, active={}", id, saved.isActive());
        return userMapper.toResponse(accessPolicy.loadForResponse(saved.getId(), saved));
    }
}
