package com.pos.email;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmailTemplateRendererTest {

    @Test
    void renderSuperAdminLoginIncludesBodyContent() {
        EmailLogoProvider logoProvider = mock(EmailLogoProvider.class);
        when(logoProvider.logoDataUri()).thenReturn("data:image/svg+xml;base64,test");

        EmailTemplateRenderer renderer = new EmailTemplateRenderer(logoProvider);
        String html = renderer.render(
            EmailTemplateType.SUPER_ADMIN_LOGIN,
            Map.of(
                "fullName", "Super Administrator",
                "username", "superadmin",
                "email", "superadmin@platform.local",
                "loginTime", "07.06.2026 12:00:00 +05",
                "ipAddress", "192.168.1.10",
                "userAgent", "Mozilla/5.0"
            )
        );

        assertTrue(html.contains("Вход в супер-админку"), "email body heading must be present");
        assertTrue(html.contains("superadmin@platform.local"), "email field must be present");
        assertTrue(html.contains("192.168.1.10"), "ip address must be present");
        assertFalse(html.contains("{{content}}"), "layout placeholder must be resolved");
        assertFalse(html.contains("{{fullName}}"), "template placeholders must be resolved");
    }
}
