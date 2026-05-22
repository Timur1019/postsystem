package com.pos.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", false);
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/reports/stock/dashboard");
        when(request.getMethod()).thenReturn("GET");
        when(request.getQueryString()).thenReturn("from=2026-05-01&to=2026-05-07");
    }

    @Test
    void notFound_returnsCodeAndMessage() {
        var ex = PosExceptions.notFound("Product", "550e8400-e29b-41d4-a716-446655440000");

        ResponseEntity<ApiErrorResponse> res = handler.handleNotFound(ex, request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().code()).isEqualTo("NOT_FOUND");
        assertThat(res.getBody().message()).contains("Product not found");
        assertThat(res.getBody().path()).isEqualTo("/api/v1/reports/stock/dashboard");
        assertThat(res.getBody().context()).isNull();
    }

    @Test
    void badRequest_withContext_includedWhenFlagEnabled() {
        ReflectionTestUtils.setField(handler, "includeContextInResponse", true);
        var ex = PosExceptions.badRequest("SKU already exists", "sku", "ABC-1");

        ResponseEntity<ApiErrorResponse> res = handler.handleBadRequest(ex, request);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().code()).isEqualTo("BAD_REQUEST");
        assertThat(res.getBody().context()).containsEntry("sku", "ABC-1");
    }

    @Test
    void internalError_hidesDetailsByDefault() {
        ResponseEntity<ApiErrorResponse> res = handler.handleGeneral(
            new ClassCastException("nested Object[]"),
            request
        );

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(res.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(res.getBody().message()).isEqualTo("An unexpected error occurred");
        assertThat(res.getBody().context()).isNull();
    }
}
