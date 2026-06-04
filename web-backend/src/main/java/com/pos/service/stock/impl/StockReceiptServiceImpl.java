package com.pos.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.dto.shared.PageResponse;
import com.pos.dto.warehouse.CreateStockReceiptRequest;
import com.pos.dto.warehouse.StockReceiptLineRequest;
import com.pos.dto.warehouse.StockReceiptLineResponse;
import com.pos.dto.warehouse.StockReceiptResponse;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.entity.StockReceipt;
import com.pos.entity.StockReceiptLine;
import com.pos.entity.Store;
import com.pos.entity.Supplier;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.StockReceiptRepository;
import com.pos.repository.SupplierRepository;
import com.pos.repository.StoreRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.service.stock.StockReceiptService;
import com.pos.service.stock.StoreStockService;
import com.pos.service.support.ProductValueNormalizer;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
public class StockReceiptServiceImpl implements StockReceiptService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final StockReceiptRepository stockReceiptRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;
    private final StoreRepository storeRepository;
    private final StoreStockService storeStockService;
    private final TenantAccessSupport tenantAccess;
    private final CurrentUserProvider currentUserProvider;

    @Override
    public StockReceiptResponse create(CreateStockReceiptRequest request) {
        if (request.lines() == null || request.lines().isEmpty()) {
            throw new BadRequestException("Add at least one line");
        }
        User user = currentUserProvider.requireCurrentUser();
        Integer companyId = tenantAccess.effectiveCompanyIdOrNull();
        if (companyId == null) {
            throw new BadRequestException("Company context is required");
        }
        Store store = storeStockService.requireStoreForCompany(companyId, request.storeId());
        Supplier supplier = resolveSupplier(request.supplierId());

        String receiptNumber = nextReceiptNumber();
        StockReceipt receipt = stockReceiptRepository.save(StockReceipt.builder()
            .receiptNumber(receiptNumber)
            .supplier(supplier)
            .store(store)
            .notes(trimToNull(request.notes()))
            .createdBy(user)
            .totalQuantity(BigDecimal.ZERO)
            .totalCost(BigDecimal.ZERO)
            .build());
        UUID receiptId = receipt.getId();

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;
        List<StockReceiptLine> lines = new ArrayList<>();

        for (StockReceiptLineRequest lineReq : request.lines()) {
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

            product.setCostPrice(lineReq.purchasePrice());
            product.setSellingPrice(lineReq.unitSellingPrice());
            if (lineReq.vatPercent() != null) {
                product.setTaxRate(ProductValueNormalizer.taxRatePercent(BigDecimal.valueOf(lineReq.vatPercent())));
            }
            if (lineReq.markedProduct() != null) {
                product.setMarkedProduct(lineReq.markedProduct());
            }
            if (StringUtils.hasText(lineReq.storageLocation())) {
                product.setStorageLocation(lineReq.storageLocation().trim());
            }
            storeStockService.increase(product, store, q);
            productRepository.save(product);

            BigDecimal lineCost = lineReq.purchasePrice()
                .multiply(q)
                .setScale(2, RoundingMode.HALF_UP);
            StockReceiptLine line = StockReceiptLine.builder()
                .receipt(receipt)
                .product(product)
                .quantity(q)
                .purchasePrice(lineReq.purchasePrice())
                .unitSellingPrice(lineReq.unitSellingPrice())
                .lineCost(lineCost)
                .build();
            lines.add(line);

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .store(store)
                .movementType(StockMovementType.RESTOCK)
                .quantity(q)
                .referenceId(receiptId)
                .notes("Приход " + receiptNumber)
                .createdBy(user)
                .build());

            totalQty = QuantityUtil.add(totalQty, q);
            totalCost = totalCost.add(lineCost);
        }

        receipt.getLines().clear();
        receipt.getLines().addAll(lines);
        receipt.setTotalQuantity(totalQty);
        receipt.setTotalCost(totalCost);
        stockReceiptRepository.save(receipt);

        return toResponse(stockReceiptRepository.findDetailedById(receiptId).orElseThrow());
    }

    @Override
    @Transactional(readOnly = true)
    public StockReceiptResponse getById(UUID id) {
        StockReceipt receipt = stockReceiptRepository.findDetailedById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        if (receipt.getStore() != null) {
            tenantAccess.assertCanAccessStore(receipt.getStore());
        }
        return toResponse(receipt);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockReceiptResponse> list(
        LocalDate from,
        LocalDate to,
        Integer storeId,
        Pageable pageable
    ) {
        Instant start = from.atStartOfDay(ZONE).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        Page<StockReceipt> page = stockReceiptRepository.findReceiptsBetween(
            start, end, storeId, companyId, pageable
        );
        return PageResponse.from(page.map(this::toSummary));
    }

    private String nextReceiptNumber() {
        LocalDate today = LocalDate.now(ZONE);
        Instant dayStart = today.atStartOfDay(ZONE).toInstant();
        long seq = stockReceiptRepository.countByCreatedAtGreaterThanEqual(dayStart) + 1;
        String datePart = today.format(DateTimeFormatter.BASIC_ISO_DATE);
        return "REC-" + datePart + "-" + String.format("%04d", seq);
    }

    private Store resolveStore(Integer storeId) {
        if (storeId == null) {
            return null;
        }
        return storeRepository.findById(storeId)
            .orElseThrow(() -> new BadRequestException("Store not found"));
    }

    private Supplier resolveSupplier(UUID supplierId) {
        if (supplierId == null) {
            return null;
        }
        return supplierRepository.findById(supplierId)
            .orElseThrow(() -> new BadRequestException("Supplier not found"));
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        return s.trim();
    }

    private StockReceiptResponse toSummary(StockReceipt r) {
        return new StockReceiptResponse(
            r.getId(),
            r.getReceiptNumber(),
            r.getSupplier() != null ? r.getSupplier().getId() : null,
            r.getSupplier() != null ? r.getSupplier().getName() : null,
            r.getStore() != null ? r.getStore().getId() : null,
            r.getStore() != null ? r.getStore().getName() : null,
            r.getNotes(),
            r.getTotalQuantity(),
            r.getTotalCost(),
            r.getCreatedBy() != null ? r.getCreatedBy().getFullName() : null,
            r.getCreatedAt(),
            List.of()
        );
    }

    private StockReceiptResponse toResponse(StockReceipt r) {
        List<StockReceiptLineResponse> lines = r.getLines().stream()
            .map(l -> new StockReceiptLineResponse(
                l.getId(),
                l.getProduct().getId(),
                l.getProduct().getName(),
                l.getProduct().getSku(),
                l.getQuantity(),
                l.getPurchasePrice(),
                l.getUnitSellingPrice(),
                l.getLineCost()
            ))
            .toList();
        return new StockReceiptResponse(
            r.getId(),
            r.getReceiptNumber(),
            r.getSupplier() != null ? r.getSupplier().getId() : null,
            r.getSupplier() != null ? r.getSupplier().getName() : null,
            r.getStore() != null ? r.getStore().getId() : null,
            r.getStore() != null ? r.getStore().getName() : null,
            r.getNotes(),
            r.getTotalQuantity(),
            r.getTotalCost(),
            r.getCreatedBy() != null ? r.getCreatedBy().getFullName() : null,
            r.getCreatedAt(),
            lines
        );
    }
}
