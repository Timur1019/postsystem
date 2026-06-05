package com.pos.service.email.impl;

import com.pos.config.MailProperties;
import com.pos.email.EmailTemplateRenderer;
import com.pos.email.EmailTemplateType;
import com.pos.entity.Company;
import com.pos.entity.User;
import com.pos.security.RoleName;
import com.pos.service.email.EmailService;
import com.pos.util.LogUtil;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final ZoneId MAIL_ZONE = ZoneId.of("Asia/Tashkent");
    private static final DateTimeFormatter LOGIN_TIME_FMT =
        DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss z");

    private final MailProperties mailProperties;
    private final EmailTemplateRenderer templateRenderer;
    @Autowired(required = false)
    private JavaMailSender mailSender;
    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:}")
    private String springMailUsername;

    @Override
    @Async("emailExecutor")
    public void sendUserCredentials(User user, String rawPassword) {
        if (!shouldSend() || user == null || !StringUtils.hasText(user.getEmail())) {
            return;
        }
        if (!mailProperties.isSendCredentialsOnCreate()) {
            return;
        }

        Company company = user.getCompany();
        Map<String, String> vars = new HashMap<>();
        vars.put("fullName", safe(user.getFullName(), user.getUsername()));
        vars.put("username", safe(user.getUsername(), ""));
        vars.put("password", safe(rawPassword, ""));
        vars.put("role", user.getRole() != null ? user.getRole().getName() : "");
        vars.put("companyName", company != null ? safe(company.getName(), "—") : "Платформа");
        vars.put("companyLoginCode", company != null ? safe(company.getLoginCode(), "—") : "—");
        vars.put("loginUrl", mailProperties.getLoginUrl());

        String html = templateRenderer.render(EmailTemplateType.USER_CREDENTIALS, vars);
        dispatch(user.getEmail(), "Данные для входа — " + mailProperties.getFromName(), html);
    }

    @Override
    @Async("emailExecutor")
    public void notifySuperAdminLogin(User user, String ipAddress, String userAgent) {
        if (!shouldSend() || user == null || !RoleName.SUPER_ADMIN.matches(user)) {
            return;
        }

        var recipients = mailProperties.superAdminLoginRecipientList();
        if (recipients.isEmpty()) {
            LogUtil.warn(EmailServiceImpl.class, "Super admin login alert skipped: no recipients configured");
            return;
        }

        Map<String, String> vars = new HashMap<>();
        vars.put("fullName", safe(user.getFullName(), user.getUsername()));
        vars.put("username", safe(user.getUsername(), ""));
        vars.put("email", safe(user.getEmail(), ""));
        vars.put("loginTime", ZonedDateTime.now(MAIL_ZONE).format(LOGIN_TIME_FMT));
        vars.put("ipAddress", safe(ipAddress, "неизвестно"));
        vars.put("userAgent", safe(userAgent, "неизвестно"));

        String html = templateRenderer.render(EmailTemplateType.SUPER_ADMIN_LOGIN, vars);
        String subject = "Вход супер-админа: " + vars.get("fullName");
        for (String recipient : recipients) {
            dispatch(recipient, subject, html);
        }
    }

    @Override
    @Async("emailExecutor")
    public void sendHtml(String to, String subject, String html) {
        if (!shouldSend() || !StringUtils.hasText(to)) {
            return;
        }
        dispatch(to, subject, html);
    }

    private void dispatch(String to, String subject, String html) {
        if (mailSender == null) {
            LogUtil.warn(EmailServiceImpl.class, "Email skipped (mail sender not configured): to={}", to);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromAddress(), mailProperties.getFromName());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            LogUtil.info(EmailServiceImpl.class, "Email sent: to={}, subject={}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException ex) {
            LogUtil.error(EmailServiceImpl.class, "Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    private boolean shouldSend() {
        if (!mailProperties.isEnabled()) {
            return false;
        }
        if (!StringUtils.hasText(resolveFromAddress())) {
            LogUtil.warn(EmailServiceImpl.class, "Email skipped: MAIL_USERNAME / MAIL_FROM is not set");
            return false;
        }
        return true;
    }

    private String resolveFromAddress() {
        if (StringUtils.hasText(mailProperties.getFrom())) {
            return mailProperties.getFrom().trim();
        }
        return StringUtils.hasText(springMailUsername) ? springMailUsername.trim() : "";
    }

    private static String safe(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }
}
