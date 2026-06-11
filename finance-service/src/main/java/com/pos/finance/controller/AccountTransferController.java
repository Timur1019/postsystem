package com.pos.finance.controller;

import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.dto.transfer.AccountTransferDto;
import com.pos.finance.dto.transfer.CreateAccountTransferRequest;
import com.pos.finance.service.AccountTransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/finance/transfers")
@RequiredArgsConstructor
@Tag(name = "Account Transfers", description = "Переводы между счетами")
public class AccountTransferController {

    private final AccountTransferService transferService;

    @GetMapping
    @Operation(summary = "Список переводов")
    public ResponseEntity<PageResponse<AccountTransferDto>> list(
        @RequestParam(required = false) Integer storeId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(transferService.list(storeId, from, to, pageable));
    }

    @PostMapping
    @Operation(summary = "Создать перевод между счетами")
    public ResponseEntity<AccountTransferDto> create(@Valid @RequestBody CreateAccountTransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transferService.create(request));
    }
}
