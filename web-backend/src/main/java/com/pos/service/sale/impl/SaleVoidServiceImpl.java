package com.pos.service.sale.impl;

import com.pos.dto.sale.SaleResponse;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.StockMovement;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.SaleMapper;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.service.sale.SaleAccessPolicy;
import com.pos.service.sale.SaleVoidService;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleVoidServiceImpl implements SaleVoidService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SaleAccessPolicy accessPolicy;

    @Override
    public SaleResponse voidSale(UUID id, String reason) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        accessPolicy.assertCanVoid(sale);

        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            throw new BadRequestException("Sale already voided");
        }

        String r = reason != null ? reason : "";
        boolean anyRemaining = false;

        for (var item : sale.getItems()) {
            int remaining = item.getQuantity() - item.getReturnedQuantity();
            if (remaining <= 0) {
                continue;
            }
            anyRemaining = true;
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + remaining);
            productRepository.save(product);

            item.setReturnedQuantity(item.getQuantity());

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType("RETURN")
                .quantity(remaining)
                .referenceId(sale.getId())
                .notes("Void: " + r)
                .build());
        }

        if (!anyRemaining && SalePartialReturnServiceImpl.allItemsFullyReturned(sale)) {
            throw new BadRequestException("Чек уже полностью возвращён");
        }

        sale.setStatus(Sale.SaleStatus.VOIDED);
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | VOID: " + r : "VOID: " + r);

        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        LogUtil.info(SaleVoidServiceImpl.class, "Sale voided: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return saleMapper.toResponse(saved);
    }
}
