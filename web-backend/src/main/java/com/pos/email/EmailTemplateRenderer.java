package com.pos.email;

import com.pos.util.LogUtil;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.EnumMap;
import java.util.Map;

@Component
public class EmailTemplateRenderer {

    private static final String TEMPLATE_DIR = "email/templates/";
    private static final String LAYOUT_FILE = "layout.html";

    private final EmailLogoProvider logoProvider;
    private final Map<EmailTemplateType, String> templateCache = new EnumMap<>(EmailTemplateType.class);
    private volatile String layoutCache;

    public EmailTemplateRenderer(EmailLogoProvider logoProvider) {
        this.logoProvider = logoProvider;
    }

    public String render(EmailTemplateType type, Map<String, String> variables) {
        Map<String, String> merged = new java.util.HashMap<>(variables != null ? variables : Map.of());
        merged.putIfAbsent("logoUrl", logoProvider.logoDataUri());
        merged.putIfAbsent("appName", "Aurent POS");
        merged.putIfAbsent("year", String.valueOf(java.time.Year.now().getValue()));

        String body = applyPlaceholders(loadTemplate(type), merged);
        String layout = loadLayout().replace("{{content}}", body);
        return applyPlaceholders(layout, merged);
    }

    private String loadLayout() {
        if (layoutCache != null) {
            return layoutCache;
        }
        synchronized (this) {
            if (layoutCache == null) {
                layoutCache = readClasspath(TEMPLATE_DIR + LAYOUT_FILE);
            }
            return layoutCache;
        }
    }

    private String loadTemplate(EmailTemplateType type) {
        return templateCache.computeIfAbsent(type, t -> readClasspath(TEMPLATE_DIR + t.fileName() + ".html"));
    }

    private static String readClasspath(String path) {
        try {
            return StreamUtils.copyToString(
                new ClassPathResource(path).getInputStream(),
                StandardCharsets.UTF_8
            );
        } catch (IOException ex) {
            LogUtil.error(EmailTemplateRenderer.class, "Failed to load email template: {}", path);
            throw new IllegalStateException("Email template not found: " + path, ex);
        }
    }

    private static String applyPlaceholders(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String value = entry.getValue() != null ? entry.getValue() : "";
            result = result.replace("{{" + entry.getKey() + "}}", escapeHtml(value));
        }
        result = result.replaceAll("\\{\\{[a-zA-Z0-9_]+\\}\\}", "");
        return result;
    }

    private static String escapeHtml(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
