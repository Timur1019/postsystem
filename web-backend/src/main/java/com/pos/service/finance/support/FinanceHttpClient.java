package com.pos.service.finance.support;

import com.pos.config.finance.FinanceServiceProperties;
import com.pos.entity.User;
import com.pos.security.TenantContext;
import com.pos.util.LogUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Enumeration;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class FinanceHttpClient {

    private final RestTemplate financeRestTemplate;
    private final FinanceServiceProperties properties;

    public ResponseEntity<String> forwardUserRequest(HttpServletRequest request, String body, User user, String authHeader) {
        if (!properties.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"message\":\"Finance service is disabled\"}");
        }
        String subPath = request.getRequestURI().replaceFirst(".*/finance", "/finance");
        String query = request.getQueryString();
        String targetUrl = properties.getBaseUrl() + subPath + (query != null ? "?" + query : "");

        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null) {
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        }
        if (user != null && user.getRole() != null) {
            headers.set("X-User-Roles", user.getRole().getName());
        }
        resolveCompanyId(user).ifPresent(companyId -> headers.set("X-Company-Id", companyId.toString()));
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (isForwardableHeader(name)) {
                headers.add(name, request.getHeader(name));
            }
        }
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        HttpEntity<String> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> upstream = financeRestTemplate.exchange(
                targetUrl,
                HttpMethod.valueOf(request.getMethod()),
                entity,
                String.class
            );
            return buildResponse(upstream.getStatusCode(), upstream.getHeaders(), upstream.getBody());
        } catch (HttpStatusCodeException ex) {
            LogUtil.warn(
                FinanceHttpClient.class,
                "Finance upstream error: url={}, status={}, body={}",
                targetUrl,
                ex.getStatusCode().value(),
                ex.getResponseBodyAsString()
            );
            return buildResponse(ex.getStatusCode(), ex.getResponseHeaders(), ex.getResponseBodyAsString());
        } catch (ResourceAccessException ex) {
            LogUtil.warn(FinanceHttpClient.class, "Finance proxy connection failed: url={}, error={}", targetUrl, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body("{\"message\":\"Finance service unavailable\"}");
        } catch (RestClientException ex) {
            LogUtil.warn(FinanceHttpClient.class, "Finance proxy failed: url={}, error={}", targetUrl, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body("{\"message\":\"Finance service unavailable\"}");
        }
    }

    public boolean postInternal(String path, Object payload) {
        if (!properties.isEnabled()) {
            return false;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Api-Key", properties.getInternalApiKey());
        try {
            financeRestTemplate.postForEntity(
                properties.getBaseUrl() + path,
                new HttpEntity<>(payload, headers),
                Void.class
            );
            return true;
        } catch (RestClientException ex) {
            LogUtil.warn(FinanceHttpClient.class, "Finance internal call failed: path={}, error={}", path, ex.getMessage());
            return false;
        }
    }

    private static Optional<Integer> resolveCompanyId(User user) {
        Optional<Integer> fromContext = TenantContext.companyId();
        if (fromContext.isPresent()) {
            return fromContext;
        }
        if (user != null && user.getCompany() != null) {
            return Optional.of(user.getCompany().getId());
        }
        return Optional.empty();
    }

    private static ResponseEntity<String> buildResponse(HttpStatusCode status, HttpHeaders upstreamHeaders, String body) {
        HttpHeaders responseHeaders = new HttpHeaders();
        MediaType contentType = upstreamHeaders != null ? upstreamHeaders.getContentType() : null;
        if (contentType != null) {
            responseHeaders.setContentType(contentType);
        } else {
            responseHeaders.setContentType(MediaType.APPLICATION_JSON);
        }
        return ResponseEntity.status(status).headers(responseHeaders).body(body);
    }

    private static boolean isForwardableHeader(String name) {
        String lower = name.toLowerCase();
        return !lower.equals("host")
            && !lower.equals("content-length")
            && !lower.equals("authorization")
            && !lower.equals("x-company-id");
    }
}
