package com.pos.config.finance;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.finance")
public class FinanceServiceProperties {

    private boolean enabled = true;
    private String baseUrl = "http://localhost:8082/api/v1";
    private String internalApiKey = "finance-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 15000;
    private int syncBatchSize = 50;
    private long syncRetryMs = 30_000L;
}
