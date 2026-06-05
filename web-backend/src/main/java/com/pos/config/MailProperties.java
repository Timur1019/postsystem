package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "app.mail")
@Getter
@Setter
public class MailProperties {

    private boolean enabled = true;
    private String from = "";
    private String fromName = "Aurent POS";
    private String loginUrl = "http://localhost/login?admin=1";
    private String superAdminLoginRecipients = "aripov1219@gmail.com,maxmudov71707@gmail.com";
    private boolean sendCredentialsOnCreate = true;

    public boolean isConfigured() {
        return StringUtils.hasText(from);
    }

    public List<String> superAdminLoginRecipientList() {
        if (!StringUtils.hasText(superAdminLoginRecipients)) {
            return List.of();
        }
        return Arrays.stream(superAdminLoginRecipients.split(","))
            .map(String::trim)
            .filter(StringUtils::hasText)
            .toList();
    }
}
