package com.pos.exception;

import com.pos.util.DbExceptionTranslator;
import com.pos.util.LogUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceException;
import org.hibernate.LazyInitializationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${app.errors.include-context:false}")
    private boolean includeContextInResponse;

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return respond(HttpStatus.NOT_FOUND, ex, req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
        String path = req.getRequestURI() != null ? req.getRequestURI() : "";
        String message = path.contains("swagger-ui") || path.contains("api-docs")
            ? "Swagger отключён. Локально: SPRING_PROFILES_ACTIVE=local и пересборка backend"
            : "Resource not found";
        logClientError(ErrorCode.NOT_FOUND, message, req, Map.of("detail", ex.getMessage()), ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            ApiErrorResponse.of(
                HttpStatus.NOT_FOUND.value(),
                ErrorCode.NOT_FOUND,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return respond(HttpStatus.BAD_REQUEST, ex, req);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex, HttpServletRequest req) {
        return respond(HttpStatus.CONFLICT, ex, req);
    }

    @ExceptionHandler(PosException.class)
    public ResponseEntity<ApiErrorResponse> handlePos(PosException ex, HttpServletRequest req) {
        HttpStatus status = switch (ex.getCode()) {
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case UNAUTHORIZED -> HttpStatus.UNAUTHORIZED;
            case VALIDATION_FAILED, BAD_REQUEST, FILE_UPLOAD_ERROR -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
        return respond(status, ex, req);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingPart(
        MissingServletRequestPartException ex,
        HttpServletRequest req
    ) {
        String part = ex.getRequestPartName();
        String message = "file".equals(part)
            ? "Файл не передан. Выберите файл и повторите."
            : "Не передана часть запроса: " + part;
        logClientError(ErrorCode.FILE_UPLOAD_ERROR, message, req, Map.of("part", part), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.FILE_UPLOAD_ERROR,
                message,
                req.getRequestURI(),
                contextForResponse(Map.of("part", part))
            )
        );
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiErrorResponse> handleMultipart(MultipartException ex, HttpServletRequest req) {
        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String message = "Ошибка загрузки файла. Проверьте формат и размер (до 15 МБ). " + detail;
        logClientError(ErrorCode.FILE_UPLOAD_ERROR, message, req, Map.of(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.FILE_UPLOAD_ERROR,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        logClientError(ErrorCode.UNAUTHORIZED, ex.getMessage(), req, Map.of(), ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            ApiErrorResponse.of(
                HttpStatus.UNAUTHORIZED.value(),
                ErrorCode.UNAUTHORIZED,
                "Invalid username or password",
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        logClientError(ErrorCode.FORBIDDEN, ex.getMessage(), req, Map.of(), ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            ApiErrorResponse.of(
                HttpStatus.FORBIDDEN.value(),
                ErrorCode.FORBIDDEN,
                "Access denied",
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(
        MethodArgumentNotValidException ex,
        HttpServletRequest req
    ) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            errors.put(field, error.getDefaultMessage());
        });
        logClientError(
            ErrorCode.VALIDATION_FAILED,
            "Validation failed",
            req,
            Map.of("fields", errors.keySet().toString()),
            ex
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new ValidationErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.VALIDATION_FAILED.name(),
                "Validation failed",
                req.getRequestURI(),
                errors
            )
        );
    }

    @ExceptionHandler({
        IllegalArgumentException.class,
        MethodArgumentTypeMismatchException.class,
        HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadInput(Exception ex, HttpServletRequest req) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Invalid request";
        logClientError(ErrorCode.BAD_REQUEST, message, req, Map.of("exception", ex.getClass().getSimpleName()), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.BAD_REQUEST,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        String message = mapDataIntegrityMessage(ex);
        logClientError(ErrorCode.CONFLICT, message, req, Map.of("db", rootMessage(ex)), ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            ApiErrorResponse.of(
                HttpStatus.CONFLICT.value(),
                ErrorCode.CONFLICT,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler({
        PersistenceException.class,
        InvalidDataAccessResourceUsageException.class,
        LazyInitializationException.class
    })
    public ResponseEntity<ApiErrorResponse> handlePersistence(
        Exception ex,
        HttpServletRequest req
    ) {
        String message = mapPersistenceClientMessage(ex);
        logClientError(ErrorCode.BAD_REQUEST, message, req, Map.of("detail", rootMessage(ex)), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.BAD_REQUEST,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleEntityNotFound(EntityNotFoundException ex, HttpServletRequest req) {
        String message = "Связанная запись не найдена (магазин, компания или роль)";
        logClientError(ErrorCode.BAD_REQUEST, message, req, Map.of("detail", rootMessage(ex)), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            ApiErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                ErrorCode.BAD_REQUEST,
                message,
                req.getRequestURI(),
                null
            )
        );
    }

    private static String mapPersistenceClientMessage(Exception ex) {
        return DbExceptionTranslator.clientMessage(ex);
    }

    private static String mapDataIntegrityMessage(DataIntegrityViolationException ex) {
        return DbExceptionTranslator.clientMessage(ex);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(Exception ex, HttpServletRequest req) {
        logServerError(ex, req);
        String clientMessage = "An unexpected error occurred";
        Map<String, Object> ctx = null;
        if (includeContextInResponse) {
            ctx = Map.of(
                "exception", ex.getClass().getSimpleName(),
                "detail", rootMessage(ex)
            );
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            ApiErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                ErrorCode.INTERNAL_ERROR,
                clientMessage,
                req.getRequestURI(),
                contextForResponse(ctx)
            )
        );
    }

    private ResponseEntity<ApiErrorResponse> respond(HttpStatus status, PosException ex, HttpServletRequest req) {
        logClientError(ex.getCode(), ex.getMessage(), req, ex.context(), ex);
        return ResponseEntity.status(status).body(
            ApiErrorResponse.of(
                status.value(),
                ex.getCode(),
                ex.getMessage(),
                req.getRequestURI(),
                contextForResponse(ex.context())
            )
        );
    }

    private Map<String, Object> contextForResponse(Map<String, Object> context) {
        if (!includeContextInResponse || context == null || context.isEmpty()) {
            return null;
        }
        return context;
    }

    private void logClientError(
        ErrorCode code,
        String message,
        HttpServletRequest req,
        Map<String, Object> context,
        Throwable ex
    ) {
        LogUtil.warn(
            GlobalExceptionHandler.class,
            "API {} {} {} user={} code={} msg={} context={}",
            req.getMethod(),
            req.getRequestURI(),
            req.getQueryString() != null ? "?" + req.getQueryString() : "",
            currentUsername(),
            code,
            message,
            context == null || context.isEmpty() ? "{}" : context,
            ex
        );
    }

    private void logServerError(Exception ex, HttpServletRequest req) {
        LogUtil.error(
            GlobalExceptionHandler.class,
            "API {} {} {} user={} code={} exception={} msg={}",
            req.getMethod(),
            req.getRequestURI(),
            req.getQueryString() != null ? "?" + req.getQueryString() : "",
            currentUsername(),
            ErrorCode.INTERNAL_ERROR,
            ex.getClass().getName(),
            rootMessage(ex),
            ex
        );
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "-";
        }
        return auth.getName();
    }

    private static String rootMessage(Throwable ex) {
        Throwable cause = ex;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
    }

    public record ValidationErrorResponse(
        int status,
        String code,
        String message,
        String path,
        java.time.Instant timestamp,
        Map<String, String> errors
    ) {
        ValidationErrorResponse(int status, String code, String message, String path, Map<String, String> errors) {
            this(status, code, message, path, java.time.Instant.now(), errors);
        }
    }
}
