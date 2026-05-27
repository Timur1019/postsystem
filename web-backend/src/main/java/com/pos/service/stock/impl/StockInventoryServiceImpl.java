package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockInventoryRequest;
import com.pos.dto.warehouse.StockInventoryLineRequest;
import com.pos.dto.warehouse.StockInventoryLineResponse;
import com.pos.dto.warehouse.StockInventoryResponse;
import com.pos.entity.Product;
import com.pos.entity.StockInventory;
import com.pos.entity.StockInventoryLine;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockInventoryRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.stock.StockInventoryService;
import com.pos.service.stock.StoreStockService;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
public class StockInventoryServiceImpl implements StockInventoryService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockInventoryRepository stockInventoryRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StoreRepository storeRepository;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final CurrentUserProvider currentUserProvider;

    @Override
    public StockInventoryResponse create(CreateStockInventoryRequest request) {
        if (request.lines() == null || request.lines().isEmpty()) {
            throw new BadRequestException("Add at least one line");
        }
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        if (companyId == null) {
            throw new BadRequestException("Company context is required");
        }
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        String number = nextInventoryNumber();
        StockInventory inventory = stockInventoryRepository.save(StockInventory.builder()
            .inventoryNumber(number)
            .store(store)
            .status("COMPLETED")
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalLines(0)
            .totalDifference(0)
            .build());
        UUID inventoryId = inventory.getId();

        int totalLines = 0;
        int totalDiff = 0;
        List<StockInventoryLine> lines = new ArrayList<>();

        for (StockInventoryLineRequest lineReq : request.lines()) {
            Product product = productRepository.findById(lineReq.productId())
                .orElseThrow(() -> new BadRequestException("Product not found: " + lineReq.productId()));
            if (!product.isActive()) {
                throw new BadRequestException("Product is not active: " + product.getName());
            }
            int systemQty = storeStockService.getQuantity(product.getId(), store.getId());
            int counted = lineReq.countedQuantity();
            int diff = counted - systemQty;
            lines.add(StockInventoryLine.builder()
                .inventory(inventory)
                .product(product)
                .systemQuantity(systemQty)
                .countedQuantity(counted)
                .difference(diff)
                .build());

            if (diff != 0) {
                storeStockService.setQuantity(product, store, counted);
                productRepository.save(product);
                stockMovementRepository.save(StockMovement.builder()
                    .product(product)
                    .store(store)
                    .movementType(StockMovementType.ADJUSTMENT)
                    .quantity(diff)
                    .referenceId(inventoryId)
                    .notes("Инвентаризация " + number)
                    .createdBy(user)
                    .build());
            }
            totalLines++;
            totalDiff += Math.abs(diff);
        }

        inventory.getLines().clear();
        inventory.getLines().addAll(lines);
        inventory.setTotalLines(totalLines);
        inventory.setTotalDifference(totalDiff);
        stockInventoryRepository.save(inventory);

        return toResponse(stockInventoryRepository.findDetailedById(inventoryId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public StockInventoryResponse getById(UUID id) {
        return stockInventoryRepository.findDetailedById(id)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockInventoryResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Page<StockInventory> page = stockInventoryRepository.findBetween(start, end, storeId, pageable);
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextInventoryNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockInventoryRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        return "INV-" + today.format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + String.format("%04d", seq);
    }

    private Store resolveStore(Integer storeId) {
        if (storeId == null) {
            return null;
        }
        return storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException("Store not found"));
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockInventoryResponse toSummary(StockInventory i) {
        return new StockInventoryResponse(
            i.getId(),
            i.getInventoryNumber(),
            i.getStore() != null ? i.getStore().getId() : null,
            i.getStore() != null ? i.getStore().getName() : null,
            i.getStatus(),
            i.getNotes(),
            i.getTotalLines(),
            i.getTotalDifference(),
            i.getCreatedBy() != null ? i.getCreatedBy().getFullName() : null,
            i.getCreatedAt(),
            List.of()
        );
    }

    private StockInventoryResponse toResponse(StockInventory i) {
        List<StockInventoryLineResponse> lines = i.getLines().stream()
            .map(l -> new StockInventoryLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getSystemQuantity(),
                l.getCountedQuantity(),
                l.getDifference()
            ))
            .toList();
        return new StockInventoryResponse(
            i.getId(),
            i.getInventoryNumber(),
            i.getStore() != null ? i.getStore().getId() : null,
            i.getStore() != null ? i.getStore().getName() : null,
            i.getStatus(),
            i.getNotes(),
            i.getTotalLines(),
            i.getTotalDifference(),
            i.getCreatedBy() != null ? i.getCreatedBy().getFullName() : null,
            i.getCreatedAt(),
            lines
        );
    }
}
