package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security.user-cache")
public class SecurityCacheProperties {

    private int maxSize = 2_000;
    private int ttlMinutes = 10;
}
