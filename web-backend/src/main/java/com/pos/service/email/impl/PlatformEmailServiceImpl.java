package com.pos.service.email.impl;

import com.pos.config.MailProperties;
import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.email.EmailTemplateRenderer;
import com.pos.email.EmailTemplateType;
import com.pos.entity.Company;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.UserRepository;
import com.pos.service.email.EmailService;
import com.pos.service.email.PlatformEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformEmailServiceImpl implements PlatformEmailService {

    private final EmailTemplateRenderer templateRenderer;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final MailProperties mailProperties;

    @Override
    public List<EmailTemplateInfoResponse> listTemplates() {
        List<EmailTemplateInfoResponse> result = new ArrayList<>();
        for (EmailTemplateType type : EmailTemplateType.values()) {
            result.add(new EmailTemplateInfoResponse(
                type.name(),
                type.title(),
                type.description(),
                type.variables()
            ));
        }
        return result;
    }

    @Override
    public EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request) {
        EmailTemplateType type = request.templateType();
        User sampleUser = resolveSampleUser(request.sampleUserId());
        Map<String, String> vars = buildVariables(type, sampleUser, request.subject(), request.message());
        if (request.overrides() != null) {
            vars.putAll(request.overrides());
        }
        String html = templateRenderer.render(type, vars);
        String subject = resolveSubject(type, request.subject(), vars);
        return new EmailTemplatePreviewResponse(subject, html);
    }

    @Override
    @Transactional
    public SendBroadcastEmailResponse sendBroadcast(SendBroadcastEmailRequest request) {
        if (!request.selectAll() && (request.userIds() == null || request.userIds().isEmpty())) {
            throw new BadRequestException("Выберите получателей или включите «все пользователи»");
        }

        List<User> recipients = resolveRecipients(request);
        int sent = 0;
        int failed = 0;
        int skipped = 0;

        for (User user : recipients) {
            if (!StringUtils.hasText(user.getEmail())) {
                skipped++;
                continue;
            }
            Map<String, String> vars = buildVariables(
                EmailTemplateType.BROADCAST,
                user,
                request.subject(),
                request.message()
            );
            String html = templateRenderer.render(EmailTemplateType.BROADCAST, vars);
            emailService.sendHtml(user.getEmail(), request.subject().trim(), html);
            sent++;
        }

        return new SendBroadcastEmailResponse(sent, failed, skipped);
    }

    private List<User> resolveRecipients(SendBroadcastEmailRequest request) {
        if (request.selectAll()) {
            return userRepository.findAllWithDetails().stream()
                .filter(User::isActive)
                .collect(Collectors.toCollection(ArrayList::new));
        }

        Set<UUID> ids = new LinkedHashSet<>(request.userIds());
        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new ResourceNotFoundException("One or more users not found");
        }
        return users;
    }

    private User resolveSampleUser(UUID sampleUserId) {
        if (sampleUserId == null) {
            return userRepository.findAllWithDetails().stream()
                .filter(u -> StringUtils.hasText(u.getEmail()))
                .findFirst()
                .orElse(null);
        }
        return userRepository.findByIdWithDetails(sampleUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Map<String, String> buildVariables(
        EmailTemplateType type,
        User user,
        String subject,
        String message
    ) {
        Map<String, String> vars = new HashMap<>();
        Company company = user != null ? user.getCompany() : null;

        switch (type) {
            case USER_CREDENTIALS -> {
                vars.put("fullName", user != null ? safe(user.getFullName(), "Иван Иванов") : "Иван Иванов");
                vars.put("username", user != null ? safe(user.getUsername(), "admin") : "admin");
                vars.put("password", "********");
                vars.put("role", user != null && user.getRole() != null ? user.getRole().getName() : "ADMIN");
                vars.put("companyName", company != null ? safe(company.getName(), "Demo Company") : "Demo Company");
                vars.put("companyLoginCode", company != null ? safe(company.getLoginCode(), "10000") : "10000");
                vars.put("loginUrl", mailProperties.getLoginUrl());
            }
            case SUPER_ADMIN_LOGIN -> {
                vars.put("fullName", user != null ? safe(user.getFullName(), "Super Admin") : "Super Admin");
                vars.put("username", user != null ? safe(user.getUsername(), "superadmin") : "superadmin");
                vars.put("email", user != null ? safe(user.getEmail(), "admin@example.com") : "admin@example.com");
                vars.put("loginTime", "05.06.2026 14:30:00 +05");
                vars.put("ipAddress", "192.168.1.10");
                vars.put("userAgent", "Mozilla/5.0 (preview)");
            }
            case BROADCAST -> {
                vars.put("recipientName", user != null ? safe(user.getFullName(), "Пользователь") : "Пользователь");
                vars.put("subject", safe(subject, "Важное сообщение"));
                vars.put("message", formatBroadcastMessage(message));
            }
        }
        return vars;
    }

    private static String resolveSubject(EmailTemplateType type, String subject, Map<String, String> vars) {
        return switch (type) {
            case USER_CREDENTIALS -> "Данные для входа — Aurent POS";
            case SUPER_ADMIN_LOGIN -> "Вход супер-админа: " + vars.getOrDefault("fullName", "");
            case BROADCAST -> safe(subject, "Рассылка");
        };
    }

    private static String formatBroadcastMessage(String message) {
        if (!StringUtils.hasText(message)) {
            return "Текст сообщения для пользователей системы.";
        }
        return message.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }

    private static String safe(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
