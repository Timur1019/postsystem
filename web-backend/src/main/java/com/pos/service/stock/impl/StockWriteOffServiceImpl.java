package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.domain.WriteOffReason;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.stock.CreateWriteOffRequest;
import com.pos.dto.stock.WriteOffRowResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.stock.StockWriteOffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Transactional
public class StockWriteOffServiceImpl implements StockWriteOffService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StoreRepository storeRepository;
    private final CurrentUserProvider currentUserProvider;

    @Override
    public WriteOffRowResponse create(CreateWriteOffRequest request) {
        if (request.quantity() < 1) {
            throw new BadRequestException("Quantity must be at least 1");
        }
        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> new BadRequestException("Product not found"));
        if (!product.isActive()) {
            throw new BadRequestException("Product is not active");
        }
        if (product.getStockQuantity() < request.quantity()) {
            throw new BadRequestException(
                "Insufficient stock. Available: " + product.getStockQuantity()
            );
        }

        WriteOffReason reason;
        try {
            reason = WriteOffReason.parse(request.reason());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }
        Store store = resolveStore(request.storeId());
        User user = currentUserProvider.requireCurrentUser();

        product.setStockQuantity(product.getStockQuantity() - request.quantity());
        productRepository.save(product);

        String notes = request.notes() != null ? request.notes().trim() : null;
        StockMovement movement = StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(StockMovementType.WRITE_OFF)
            .writeOffReason(reason.name())
            .quantity(-request.quantity())
            .notes(notes)
            .createdBy(user)
            .build();
        StockMovement saved = stockMovementRepository.save(movement);
        return toRow(saved, product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WriteOffRowResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Page<StockMovement> page = stockMovementRepository.findWriteOffsBetween(start, end, storeId, pageable);
        return PageResponse.from(page.map(m -> toRow(m, m.getProduct())));
    }

    private Store resolveStore(Integer storeId) {
        if (storeId == null) {
            return null;
        }
        return storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException("Store not found"));
    }

    private WriteOffRowResponse toRow(StockMovement m, Product product) {
        int units = m.getQuantity() < 0 ? -m.getQuantity() : m.getQuantity();
        BigDecimal loss = product.getCostPrice()
            .multiply(BigDecimal.valueOf(units))
            .setScale(2, RoundingMode.HALF_UP);
        String createdByName = m.getCreatedBy() != null ? m.getCreatedBy().getFullName() : null;
        String storeName = m.getStore() != null ? m.getStore().getName() : null;
        return new WriteOffRowResponse(
            m.getId(),
            m.getCreatedAt(),
            product.getId(),
            product.getName(),
            product.getSku(),
            units,
            m.getWriteOffReason() != null ? m.getWriteOffReason() : WriteOffReason.OTHER.name(),
            m.getNotes(),
            m.getStore() != null ? m.getStore().getId() : null,
            storeName,
            createdByName,
            loss
        );
    }
}
