package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.user.CreateUserRequest;
import com.pos.dto.user.UpdateUserRequest;
import com.pos.dto.user.UserResponse;
import com.pos.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Users", description = "Управление пользователями компании")
@StandardApiResponses
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Список пользователей", description = "Получение всех пользователей текущей компании")
    @ApiResponse(responseCode = "200", description = "Список пользователей")
    public ResponseEntity<List<UserResponse>> list() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Пользователь по ID", description = "Получение пользователя по UUID")
    @ApiResponse(responseCode = "200", description = "Данные пользователя")
    public ResponseEntity<UserResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Создать пользователя", description = "Создание нового пользователя компании")
    @ApiResponse(responseCode = "201", description = "Пользователь создан")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить пользователя", description = "Изменение данных пользователя")
    @ApiResponse(responseCode = "200", description = "Пользователь обновлён")
    public ResponseEntity<UserResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Переключить активность", description = "Активация или деактивация пользователя")
    @ApiResponse(responseCode = "200", description = "Статус пользователя изменён")
    public ResponseEntity<UserResponse> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }
}
