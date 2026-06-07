package com.pos.service.impl;

import com.pos.dto.platform.security.CashierServerPasswordStatusResponse;
import com.pos.dto.platform.security.CreatePlatformSuperAdminRequest;
import com.pos.dto.platform.security.PlatformSuperAdminResponse;
import com.pos.dto.platform.security.UpdateCashierServerPasswordRequest;
import com.pos.dto.platform.security.UpdatePlatformSuperAdminRequest;
import com.pos.dto.platform.security.VerifyCashierServerPasswordResponse;
import com.pos.entity.PlatformSetting;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ConflictException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.PlatformSettingRepository;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.repository.spec.UserSpecifications;
import com.pos.security.RoleName;
import com.pos.service.PlatformSecurityService;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.LogUtil;
import com.pos.util.PersonNameUtil;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformSecurityServiceImpl implements PlatformSecurityService {

    private static final String DEFAULT_CASHIER_SERVER_PASSWORD = "aurnt";

    private final PlatformSettingRepository platformSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public CashierServerPasswordStatusResponse getCashierServerPasswordStatus() {
        assertSuperAdminActor();
        return toPasswordStatus(findOrInitPasswordSetting());
    }

    @Override
    @Transactional
    public CashierServerPasswordStatusResponse updateCashierServerPassword(UpdateCashierServerPasswordRequest request) {
        assertSuperAdminActor();
        PlatformSetting setting = findOrInitPasswordSetting();
        setting.setSettingValue(passwordEncoder.encode(request.password().trim()));
        PlatformSetting saved = platformSettingRepository.save(setting);
        LogUtil.info(PlatformSecurityServiceImpl.class, "Cashier server setup password updated");
        return toPasswordStatus(saved);
    }

    @Override
    public VerifyCashierServerPasswordResponse verifyCashierServerPassword(String password) {
        if (!StringUtils.hasText(password)) {
            return new VerifyCashierServerPasswordResponse(false);
        }
        PlatformSetting setting = findOrInitPasswordSetting();
        boolean valid = passwordEncoder.matches(password.trim(), setting.getSettingValue());
        return new VerifyCashierServerPasswordResponse(valid);
    }

    @Override
    public List<PlatformSuperAdminResponse> listSuperAdmins() {
        assertSuperAdminActor();
        return userRepository.findAll(
            UserSpecifications.lookup()
                .platformOnly()
                .roleName(RoleName.SUPER_ADMIN.name())
                .build()
        ).stream()
            .map(this::toSuperAdminResponse)
            .toList();
    }

    @Override
    @Transactional
    public PlatformSuperAdminResponse createSuperAdmin(CreatePlatformSuperAdminRequest request) {
        assertSuperAdminActor();
        Role role = roleRepository.findByName(RoleName.SUPER_ADMIN.name())
            .orElseThrow(() -> new BadRequestException("SUPER_ADMIN role is not configured"));

        String username = UserLoginUtil.normalizeUsername(request.username());
        String email = UserLoginUtil.normalizeEmail(request.email());
        assertPlatformUsernameAvailable(username, null);
        assertPlatformEmailAvailable(email, null);

        User user = User.builder()
            .username(username)
            .email(email)
            .password(passwordEncoder.encode(request.password().trim()))
            .firstName(request.firstName().trim())
            .lastName(request.lastName().trim())
            .fullName(PersonNameUtil.buildFullName(request.lastName(), request.firstName(), null))
            .role(role)
            .company(null)
            .isActive(true)
            .build();
        user.syncFullName();
        User saved = userRepository.save(user);
        LogUtil.info(PlatformSecurityServiceImpl.class, "Platform super-admin created: id={}, username={}", saved.getId(), saved.getUsername());
        return toSuperAdminResponse(saved);
    }

    @Override
    @Transactional
    public PlatformSuperAdminResponse updateSuperAdmin(UUID id, UpdatePlatformSuperAdminRequest request) {
        assertSuperAdminActor();
        User user = requirePlatformSuperAdmin(id);

        if (StringUtils.hasText(request.firstName())) {
            user.setFirstName(request.firstName().trim());
        }
        if (StringUtils.hasText(request.lastName())) {
            user.setLastName(request.lastName().trim());
        }
        user.syncFullName();

        if (StringUtils.hasText(request.password())) {
            user.setPassword(passwordEncoder.encode(request.password().trim()));
        }

        User saved = userRepository.save(user);
        LogUtil.info(PlatformSecurityServiceImpl.class, "Platform super-admin updated: id={}", id);
        return toSuperAdminResponse(saved);
    }

    private PlatformSetting findOrInitPasswordSetting() {
        return platformSettingRepository.findById(PlatformSetting.KEY_CASHIER_SERVER_SETUP_PASSWORD)
            .orElseGet(() -> {
                PlatformSetting created = PlatformSetting.builder()
                    .settingKey(PlatformSetting.KEY_CASHIER_SERVER_SETUP_PASSWORD)
                    .settingValue(passwordEncoder.encode(DEFAULT_CASHIER_SERVER_PASSWORD))
                    .updatedAt(Instant.now())
                    .build();
                return platformSettingRepository.save(created);
            });
    }

    private CashierServerPasswordStatusResponse toPasswordStatus(PlatformSetting setting) {
        String updatedAt = setting.getUpdatedAt() != null ? setting.getUpdatedAt().toString() : null;
        return new CashierServerPasswordStatusResponse(true, updatedAt);
    }

    private PlatformSuperAdminResponse toSuperAdminResponse(User user) {
        return new PlatformSuperAdminResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.isActive()
        );
    }

    private User requirePlatformSuperAdmin(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!RoleName.SUPER_ADMIN.matches(user) || user.getCompany() != null) {
            throw new BadRequestException("User is not a platform super-admin");
        }
        return user;
    }

    private void assertSuperAdminActor() {
        if (!tenantAccess.isSuperAdmin()) {
            throw new BadRequestException("Access denied");
        }
    }

    private void assertPlatformUsernameAvailable(String username, UUID excludeId) {
        long count = userRepository.count(
            UserSpecifications.lookup().platformOnly().usernameIgnoreCase(username).excludeId(excludeId).build()
        );
        if (count > 0) {
            throw new ConflictException("Username already taken");
        }
    }

    private void assertPlatformEmailAvailable(String email, UUID excludeId) {
        long count = userRepository.count(
            UserSpecifications.lookup().platformOnly().emailIgnoreCase(email).excludeId(excludeId).build()
        );
        if (count > 0) {
            throw new ConflictException("Email already taken");
        }
    }
}
