package com.pos.controller;

import com.pos.dto.shared.PageResponse;
import com.pos.dto.store.CreateStoreRequest;
import com.pos.dto.store.StoreResponse;
import com.pos.dto.store.UpdateStoreRequest;
import com.pos.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping
    public List<StoreResponse> list() {
        return storeService.listStores();
    }

    @GetMapping("/manage")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PageResponse<StoreResponse>> listManaged(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Integer companyId,
        @PageableDefault(size = 14) Pageable pageable
    ) {
        return ResponseEntity.ok(storeService.listManaged(search, companyId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'CASHIER', 'MANAGER')")
    public ResponseEntity<StoreResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<StoreResponse> create(@Valid @RequestBody CreateStoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(storeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<StoreResponse> update(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateStoreRequest request
    ) {
        return ResponseEntity.ok(storeService.update(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<StoreResponse> toggle(@PathVariable Integer id) {
        return ResponseEntity.ok(storeService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        storeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
