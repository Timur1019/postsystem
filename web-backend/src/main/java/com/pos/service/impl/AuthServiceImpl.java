package com.pos.service.impl;

import com.pos.dto.auth.AuthRequest;
import com.pos.dto.auth.AuthResponse;
import com.pos.dto.auth.CashierPinAuthRequest;
import com.pos.dto.auth.RegisterRequest;
import com.pos.entity.Company;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.mapper.AuthMapper;
import com.pos.repository.CompanyRepository;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.security.JwtService;
import com.pos.security.RoleName;
import com.pos.service.AuditService;
import com.pos.service.AuthService;
import com.pos.service.ModuleAccessService;
import com.pos.util.CompanyLoginCodeUtil;
import com.pos.util.CashierPinUtil;
import com.pos.util.LogUtil;
import com.pos.util.UserLoginUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final AuthMapper authMapper;
    private final ModuleAccessService moduleAccessService;
    private final CurrentUserProvider currentUserProvider;
    @Value("${app.jwt.secret}")
    private String pinSecret;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = UserLoginUtil.normalizeUsername(request.username());
        if (userRepository.existsPlatformUsernameIgnoreCase(username, null)) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsPlatformEmailIgnoreCase(UserLoginUtil.normalizeEmail(request.email()), null)) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Default role not found"));

        User user = User.builder()
            .username(username)
            .email(UserLoginUtil.normalizeEmail(request.email()))
            .password(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(role)
            .isActive(true)
            .build();

        userRepository.save(user);
        auditService.log(user, "USER_REGISTERED", "User", user.getId().toString(), null, null);

        String token = jwtService.generateToken(user);
        LogUtil.info(AuthServiceImpl.class, "User registered: username={}", user.getUsername());
        return buildResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse authenticate(AuthRequest request) {
        String username = UserLoginUtil.normalizeUsername(request.username());
        String companyCode = CompanyLoginCodeUtil.normalize(request.companyLoginCode());

        User user = resolveUserForLogin(companyCode, username);
        assertLoginAllowed(user);

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid username or password");
        }

        auditService.log(user, "LOGIN", null, null, null, null);

        String token = jwtService.generateToken(user);
        LogUtil.info(
            AuthServiceImpl.class,
            "User authenticated: username={}, companyId={}",
            user.getUsername(),
            user.getCompany() != null ? user.getCompany().getId() : null
        );
        return buildResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse authenticateCashierPin(CashierPinAuthRequest request) {
        String companyCode = CompanyLoginCodeUtil.normalize(request.companyLoginCode());
        String pin = CashierPinUtil.normalizePin(request.pin());
        if (pin.length() < 4 || pin.length() > 6) {
            throw new BadRequestException("Invalid PIN");
        }

        Company company = companyRepository.findByLoginCodeIgnoreCase(companyCode)
            .orElseThrow(() -> new BadRequestException("Invalid company code"));

        if (!company.isActive()) {
            throw new BadRequestException("Company is inactive");
        }

        String digest = CashierPinUtil.digestHex(pin, pinSecret);
        User user = userRepository.findCashierByCompanyIdAndPinDigest(company.getId(), digest)
            .orElseThrow(() -> new BadRequestException("Invalid PIN"));
        assertLoginAllowed(user);

        String token = jwtService.generateToken(user);
        auditService.log(user, "LOGIN_PIN", null, null, null, null);
        LogUtil.info(AuthServiceImpl.class, "Cashier PIN authenticated: userId={}, companyId={}", user.getId(), company.getId());
        return buildResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPassword(String password) {
        User user = currentUserProvider.requireCurrentUser();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadRequestException("Invalid password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPin(String pin) {
        User user = currentUserProvider.requireCurrentUser();
        String normalized = CashierPinUtil.normalizePin(pin);
        if (normalized.length() < 4 || normalized.length() > 6) {
            throw new BadRequestException("Invalid PIN");
        }
        if (!StringUtils.hasText(user.getPinDigest())) {
            throw new BadRequestException("PIN is not configured");
        }
        String digest = CashierPinUtil.digestHex(normalized, pinSecret);
        if (!digest.equalsIgnoreCase(user.getPinDigest())) {
            throw new BadRequestException("Invalid PIN");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String token) {
        UUID userId = jwtService.extractSubjectUserId(token);
        User user = userRepository.findByIdWithDetails(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (!jwtService.isTokenValid(token, user)) {
            throw new BadRequestException("Invalid or expired token");
        }

        String newToken = jwtService.generateToken(user);
        return buildResponse(user, newToken);
    }

    private User resolveUserForLogin(String companyCode, String username) {
        if (StringUtils.hasText(companyCode)) {
            Company company = companyRepository.findByLoginCodeIgnoreCase(companyCode)
                .orElseThrow(() -> new BadRequestException("Invalid company code"));

            if (!company.isActive()) {
                throw new BadRequestException("Company is inactive");
            }

            return userRepository.findByCompanyIdAndUsernameIgnoreCase(company.getId(), username)
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));
        }

        return userRepository.findPlatformUserByUsernameIgnoreCase(username)
            .or(() -> userRepository.findTenantUserByUsernameIgnoreCase(username))
            .orElseThrow(() -> new BadRequestException("Invalid username or password"));
    }

    private static void assertLoginAllowed(User user) {
        if (!user.isActive()) {
            throw new BadRequestException("User account is disabled");
        }
        if (RoleName.SUPER_ADMIN.matches(user) && user.getCompany() != null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!RoleName.SUPER_ADMIN.matches(user) && user.getCompany() == null) {
            throw new BadRequestException("Invalid username or password");
        }
        if (!RoleName.SUPER_ADMIN.matches(user) && user.getCompany() != null && !user.getCompany().isActive()) {
            throw new BadRequestException("Company is inactive");
        }
    }

    private AuthResponse buildResponse(User user, String token) {
        return authMapper.toResponse(
            user,
            token,
            moduleAccessService.resolveAllowedModuleIds(user),
            user.isModuleAccessCustom()
        );
    }
}
