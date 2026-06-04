package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockTransferRequest;
import com.pos.dto.warehouse.StockTransferLineRequest;
import com.pos.dto.warehouse.StockTransferLineResponse;
import com.pos.dto.warehouse.StockTransferResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.StockTransfer;
import com.pos.entity.StockTransferLine;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StockTransferRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.stock.StockTransferService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pos.util.QuantityUtil;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StockTransferServiceImpl implements StockTransferService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockTransferRepository stockTransferRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StoreRepository storeRepository;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;

    @Override
    public StockTransferResponse create(CreateStockTransferRequest request) {
        if (request.fromStoreId().equals(request.toStoreId())) {
            throw new BadRequestException("From and to store must differ");
        }
        if (request.lines() == null || request.lines().isEmpty()) {
            throw new BadRequestException("Add at least one line");
        }
        User user = currentUserProvider.requireCurrentUser();
        Store fromStore = storeRepository.findById(request.fromStoreId())
            .orElseThrow(() -> new BadRequestException("From store not found"));
        Store toStore = storeRepository.findById(request.toStoreId())
            .orElseThrow(() -> new BadRequestException("To store not found"));
        tenantAccess.assertCanAccessStore(fromStore);
        tenantAccess.assertCanAccessStore(toStore);
        if (fromStore.getCompany() == null
            || toStore.getCompany() == null
            || !fromStore.getCompany().getId().equals(toStore.getCompany().getId())) {
            throw new BadRequestException("Transfer is allowed only between stores of the same company");
        }

        String number = nextTransferNumber();
        StockTransfer transfer = stockTransferRepository.save(StockTransfer.builder()
            .transferNumber(number)
            .fromStore(fromStore)
            .toStore(toStore)
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalQuantity(BigDecimal.ZERO)
            .build());
        UUID transferId = transfer.getId();

        BigDecimal totalQty = BigDecimal.ZERO;
        List<StockTransferLine> lines = new ArrayList<>();

        for (StockTransferLineRequest lineReq : request.lines()) {
            Product product = productRepository.findById(lineReq.productId())
                .orElseThrow(() -> new BadRequestException("Product not found: " + lineReq.productId()));
            if (!product.isActive()) {
                throw new BadRequestException("Product is not active: " + product.getName());
            }
            BigDecimal q = QuantityUtil.normalize(lineReq.quantity());
            if (q.signum() <= 0) {
                throw new BadRequestException("Quantity must be greater than zero");
            }
            com.pos.util.QuantityValidator.validate(product, q);
            if (product.getStockQuantity().compareTo(q) < 0) {
                throw new BadRequestException("Insufficient stock for " + product.getName());
            }

            lines.add(StockTransferLine.builder()
                .transfer(transfer)
                .product(product)
                .quantity(q)
                .build());

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .store(fromStore)
                .movementType(StockMovementType.ADJUSTMENT)
                .quantity(q.negate())
                .referenceId(transferId)
                .notes("Перемещение " + number + " → " + toStore.getName())
                .createdBy(user)
                .build());
            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .store(toStore)
                .movementType(StockMovementType.RESTOCK)
                .quantity(q)
                .referenceId(transferId)
                .notes("Перемещение " + number + " ← " + fromStore.getName())
                .createdBy(user)
                .build());

            totalQty = QuantityUtil.add(totalQty, q);
        }

        transfer.getLines().clear();
        transfer.getLines().addAll(lines);
        transfer.setTotalQuantity(totalQty);
        stockTransferRepository.save(transfer);

        return toResponse(stockTransferRepository.findDetailedById(transferId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public StockTransferResponse getById(UUID id) {
        StockTransfer transfer = stockTransferRepository.findDetailedById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Transfer not found"));
        tenantAccess.assertCanAccessStore(transfer.getFromStore());
        return toResponse(transfer);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockTransferResponse> list(
        LocalDate from,
        LocalDate to,
        Integer fromStoreId,
        Integer toStoreId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockTransfer> page = stockTransferRepository.findBetween(
            companyId, start, end, fromStoreId, toStoreId, pageable
        );
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextTransferNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockTransferRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "TRF-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockTransferResponse toSummary(StockTransfer t) {
        return new StockTransferResponse(
            t.getId(),
            t.getTransferNumber(),
            t.getFromStore().getId(),
            t.getFromStore().getName(),
            t.getToStore().getId(),
            t.getToStore().getName(),
            t.getNotes(),
            t.getTotalQuantity(),
            t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null,
            t.getCreatedAt(),
            List.of()
        );
    }

    private StockTransferResponse toResponse(StockTransfer t) {
        List<StockTransferLineResponse> lines = t.getLines().stream()
            .map(l -> new StockTransferLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getQuantity()
            ))
            .toList();
        return new StockTransferResponse(
            t.getId(),
            t.getTransferNumber(),
            t.getFromStore().getId(),
            t.getFromStore().getName(),
            t.getToStore().getId(),
            t.getToStore().getName(),
            t.getNotes(),
            t.getTotalQuantity(),
            t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : null,
            t.getCreatedAt(),
            lines
        );
    }
}
