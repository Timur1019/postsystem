package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;
import com.pos.service.email.PlatformEmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/platform/email")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Platform Email", description = "Платформенная рассылка и шаблоны email (SUPER_ADMIN)")
@StandardApiResponses
public class PlatformEmailController {

    private final PlatformEmailService platformEmailService;

    @GetMapping("/templates")
    @Operation(summary = "Список шаблонов", description = "Доступные email-шаблоны платформы")
    @ApiResponse(responseCode = "200", description = "Список шаблонов")
    public ResponseEntity<List<EmailTemplateInfoResponse>> templates() {
        return ResponseEntity.ok(platformEmailService.listTemplates());
    }

    @PostMapping("/templates/preview")
    @Operation(summary = "Предпросмотр шаблона", description = "Рендер email-шаблона с подстановкой переменных")
    @ApiResponse(responseCode = "200", description = "HTML предпросмотра")
    public ResponseEntity<EmailTemplatePreviewResponse> preview(
        @Valid @RequestBody EmailTemplatePreviewRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.preview(request));
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Массовая рассылка", description = "Отправка email-рассылки выбранным получателям")
    @ApiResponse(responseCode = "200", description = "Результат рассылки")
    public ResponseEntity<SendBroadcastEmailResponse> broadcast(
        @Valid @RequestBody SendBroadcastEmailRequest request
    ) {
        return ResponseEntity.ok(platformEmailService.sendBroadcast(request));
    }
}
