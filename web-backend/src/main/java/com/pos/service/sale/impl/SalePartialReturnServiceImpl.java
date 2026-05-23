package com.pos.service.sale.impl;

import com.pos.dto.sale.PartialReturnLineRequest;
import com.pos.dto.sale.PartialReturnRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.domain.StockMovementType;
import com.pos.entity.StockMovement;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.SaleMapper;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.service.sale.SaleAccessPolicy;
import com.pos.service.sale.SalePartialReturnService;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.stock.StoreStockService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SalePartialReturnServiceImpl implements SalePartialReturnService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SaleAccessPolicy accessPolicy;
    private final StoreStockService storeStockService;

    @Override
    public SaleResponse returnItems(UUID saleId, PartialReturnRequest request) {
        Sale sale = saleRepository.findById(saleId)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        accessPolicy.assertCanVoid(sale);

        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            throw new BadRequestException("Чек уже полностью возвращён");
        }

        Map<UUID, SaleItem> itemsById = new HashMap<>();
        sale.getItems().forEach(item -> itemsById.put(item.getId(), item));

        String reason = request.reason() != null ? request.reason().trim() : "";
        boolean anyReturned = false;

        for (PartialReturnLineRequest line : request.lines()) {
            SaleItem item = itemsById.get(line.saleItemId());
            if (item == null) {
                throw new BadRequestException("Позиция чека не найдена: " + line.saleItemId());
            }
            int remaining = item.getQuantity() - item.getReturnedQuantity();
            if (line.quantity() > remaining) {
                throw new BadRequestException(
                    "Нельзя вернуть больше, чем осталось по позиции: " + item.getProductName()
                );
            }
            if (line.quantity() <= 0) {
                continue;
            }

            item.setReturnedQuantity(item.getReturnedQuantity() + line.quantity());
            restoreStock(sale, item, line.quantity(), reason);
            anyReturned = true;
        }

        if (!anyReturned) {
            throw new BadRequestException("Укажите количество для возврата");
        }

        appendReturnNote(sale, reason, allItemsFullyReturned(sale));

        if (allItemsFullyReturned(sale)) {
            sale.setStatus(Sale.SaleStatus.VOIDED);
        } else {
            sale.setStatus(Sale.SaleStatus.REFUNDED);
        }

        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        LogUtil.info(
            SalePartialReturnServiceImpl.class,
            "Partial return: sale={}, receipt={}, status={}",
            saved.getId(),
            saved.getReceiptNumber(),
            saved.getStatus()
        );
        return saleMapper.toResponse(saved);
    }

    static boolean allItemsFullyReturned(Sale sale) {
        return sale.getItems().stream()
            .allMatch(item -> item.getReturnedQuantity() >= item.getQuantity());
    }

    static BigDecimal lineReturnAmount(SaleItem item, int returnQty) {
        if (returnQty <= 0) {
            return BigDecimal.ZERO;
        }
        if (returnQty >= item.getQuantity()) {
            return item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        }
        BigDecimal lineTotal = item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO;
        return lineTotal
            .multiply(BigDecimal.valueOf(returnQty))
            .divide(BigDecimal.valueOf(item.getQuantity()), 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal totalReturnedAmount(Sale sale) {
        BigDecimal sum = BigDecimal.ZERO;
        for (SaleItem item : sale.getItems()) {
            sum = sum.add(lineReturnAmount(item, item.getReturnedQuantity()));
        }
        return sum;
    }

    private void restoreStock(Sale sale, SaleItem item, int qty, String reason) {
        Product product = item.getProduct();
        if (sale.getStore() != null) {
            storeStockService.increase(product, sale.getStore(), qty);
        }
        productRepository.save(product);

        stockMovementRepository.save(StockMovement.builder()
            .product(product)
            .store(sale.getStore())
            .movementType(StockMovementType.RETURN)
            .quantity(qty)
            .referenceId(sale.getId())
            .createdBy(sale.getCashier())
            .notes("Return: " + reason)
            .build());
    }

    private static void appendReturnNote(Sale sale, String reason, boolean full) {
        String tag = full ? "VOID" : "PARTIAL_RETURN";
        String note = reason != null && !reason.isBlank() ? tag + ": " + reason : tag;
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | " + note : note);
    }
}
