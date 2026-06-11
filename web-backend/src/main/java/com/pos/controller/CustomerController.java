package com.pos.controller;

import com.pos.config.openapi.StandardApiResponses;
import com.pos.dto.customer.CreateCustomerRequest;
import com.pos.dto.customer.CustomerResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Справочник покупателей")
@StandardApiResponses
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "Список покупателей", description = "Поиск и постраничный список покупателей")
    @ApiResponse(responseCode = "200", description = "Список покупателей")
    public ResponseEntity<PageResponse<CustomerResponse>> list(
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(customerService.list(search, pageable));
    }

    @PostMapping
    @Operation(summary = "Создать покупателя", description = "Быстрое добавление покупателя с кассы или из справочника")
    @ApiResponse(responseCode = "201", description = "Покупатель создан")
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(request));
    }
}
