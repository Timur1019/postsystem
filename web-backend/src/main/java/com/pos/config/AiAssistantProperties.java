package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.ai")
public class AiAssistantProperties {

    private boolean enabled = false;

    private String provider = "deepseek";

    private String baseUrl = "https://api.deepseek.com";

    private String apiKey;

    private String model = "deepseek-chat";

    private int connectTimeoutMs = 5000;

    private int readTimeoutMs = 20000;

    private int maxPromptChars = 2000;

    private int maxRequestsPerMinutePerUser = 20;
}

