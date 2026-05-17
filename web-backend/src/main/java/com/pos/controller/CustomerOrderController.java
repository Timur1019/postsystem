package com.pos.controller;

import com.pos.dto.order.CreateCustomerOrderRequest;
import com.pos.dto.order.CourierOptionResponse;
import com.pos.dto.order.CustomerOrderCreatedResponse;
import com.pos.dto.order.CustomerOrderRowResponse;
import com.pos.dto.order.PhotoDownload;
import com.pos.dto.shared.PageResponse;
import com.pos.service.CustomerOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;

    @GetMapping("/couriers")
    public List<CourierOptionResponse> couriers() {
        return customerOrderService.listCourierCandidates();
    }

    @GetMapping
    public ResponseEntity<PageResponse<CustomerOrderRowResponse>> list(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String externalNumber,
        @RequestParam(required = false) String clientName,
        @RequestParam(required = false) String address,
        @RequestParam(required = false) UUID courierId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(customerOrderService.list(
            search, externalNumber, clientName, address, courierId, status, createdFrom, createdTo, pageable));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CustomerOrderCreatedResponse> create(
        @Valid @RequestBody CreateCustomerOrderRequest body,
        @AuthenticationPrincipal UserDetails user
    ) {
        return ResponseEntity.status(201)
            .body(customerOrderService.createOrder(body, user.getUsername()));
    }

    @GetMapping("/{id}/photos/{slot}")
    public ResponseEntity<Resource> photo(@PathVariable long id, @PathVariable int slot) {
        PhotoDownload dl = customerOrderService.loadPhoto(id, slot);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"photo-" + slot + "\"")
            .contentType(MediaType.parseMediaType(dl.contentType()))
            .body(dl.resource());
    }
}
