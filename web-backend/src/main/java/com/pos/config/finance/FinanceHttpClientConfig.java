package com.pos.config.finance;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.util.Timeout;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class FinanceHttpClientConfig {

    @Bean
    public RestTemplate financeRestTemplate(FinanceServiceProperties properties, RestTemplateBuilder builder) {
        RequestConfig requestConfig = RequestConfig.custom()
            .setConnectTimeout(Timeout.ofMilliseconds(properties.getConnectTimeoutMs()))
            .setConnectionRequestTimeout(Timeout.ofMilliseconds(properties.getConnectTimeoutMs()))
            .setResponseTimeout(Timeout.ofMilliseconds(properties.getReadTimeoutMs()))
            .build();

        var httpClient = HttpClients.custom()
            .setDefaultRequestConfig(requestConfig)
            .build();

        HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory(httpClient);

        return builder
            .requestFactory(() -> requestFactory)
            .build();
    }
}
