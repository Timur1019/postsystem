package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.ai.AiAssistantRequest;
import com.pos.dto.ai.AiAssistantResponse;
import com.pos.service.ai.AiAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai/assistant")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "AI Assistant", description = "ИИ-ассистент для администратора")
@StandardApiResponses
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    @Operation(summary = "Чат с ассистентом", description = "Отправка сообщения ИИ-ассистенту с контекстом истории")
    @ApiResponse(responseCode = "200", description = "Ответ ассистента")
    public ResponseEntity<AiAssistantResponse> chat(@Valid @RequestBody AiAssistantRequest request) {
        return ResponseEntity.ok(aiAssistantService.ask(request.message(), request.safeHistory()));
    }
}
