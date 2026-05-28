package com.pos.controller;

import com.pos.dto.ai.AiAssistantRequest;
import com.pos.dto.ai.AiAssistantResponse;
import com.pos.service.ai.AiAssistantService;
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
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/chat")
    public ResponseEntity<AiAssistantResponse> chat(@Valid @RequestBody AiAssistantRequest request) {
        return ResponseEntity.ok(aiAssistantService.ask(request.message()));
    }
}

