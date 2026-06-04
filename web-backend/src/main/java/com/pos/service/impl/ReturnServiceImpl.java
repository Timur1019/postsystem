package com.pos.service.impl;

import com.pos.dto.returns.ReturnRowResponse;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.Store;
import com.pos.domain.StockMovementType;
import com.pos.entity.StockMovement;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.ReturnMapper;
import com.pos.mapper.SaleMapper;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleItemRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.service.ReturnService;
import com.pos.service.sale.SaleAccessPolicy;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.stock.StoreStockService;
import com.pos.util.ReturnNotesSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StoreStockService storeStockService;
    private final ReturnMapper returnMapper;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final TenantAccessSupport tenantAccess;
    private final SaleAccessPolicy saleAccessPolicy;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnRowResponse> list(
        LocalDate from,
        LocalDate to,
        String cashierName,
        String fiscalSearch,
        Integer storeId,
        Pageable pageable
    ) {
        ZoneId z = ZoneId.systemDefault();
        Instant start = from != null ? from.atStartOfDay(z).toInstant() : Instant.EPOCH;
        Instant end = to != null ? to.plusDays(1).atStartOfDay(z).toInstant()
            : Instant.now().plus(3650, ChronoUnit.DAYS);
        Page<Sale> page = saleRepository.searchReturns(
            List.of(Sale.SaleStatus.VOIDED, Sale.SaleStatus.REFUNDED),
            start,
            end,
            blankToNull(cashierName),
            blankToNull(fiscalSearch),
            storeId,
            tenantAccess.requireEffectiveCompanyId(),
            pageable
        );
        return PageResponse.from(page.map(sale -> returnMapper.toRowResponse(
            sale,
            (int) saleItemRepository.countBySale_Id(sale.getId())
        )));
    }

    @Override
    @Transactional(readOnly = true)
    public SaleResponse getDetails(UUID id) {
        Sale sale = requireReturnSale(id);
        return saleMapper.toResponse(sale);
    }

    @Override
    @Transactional
    public ReturnRowResponse updateReason(UUID id, String reason) {
        Sale sale = requireReturnSale(id);
        sale.setNotes(ReturnNotesSupport.withVoidReason(sale.getNotes(), reason));
        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        return returnMapper.toRowResponse(
            saved,
            (int) saleItemRepository.countBySale_Id(saved.getId())
        );
    }

    @Override
    @Transactional
    public void cancelReturn(UUID id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Return not found"));
        saleAccessPolicy.assertCanView(sale);

        if (sale.getStatus() != Sale.SaleStatus.VOIDED) {
            throw new BadRequestException("Отмена доступна только для аннулированных чеков (VOIDED)");
        }

        Store store = sale.getStore();
        if (store == null) {
            throw new BadRequestException("У продажи не указан магазин");
        }

        sale.getItems().forEach(item -> {
            Product product = item.getProduct();
            storeStockService.requireAvailable(product, store, item.getQuantity());
            storeStockService.decrease(product, store, item.getQuantity());

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .store(sale.getStore())
                .movementType(StockMovementType.SALE)
                .quantity(item.getQuantity().negate())
                .referenceId(sale.getId())
                .createdBy(sale.getCashier())
                .notes("Отмена возврата, восстановление продажи")
                .build());
        });

        sale.setStatus(Sale.SaleStatus.COMPLETED);
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | REVERTED" : "REVERTED");
        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
    }

    private Sale requireReturnSale(UUID id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Return not found"));
        if (sale.getStatus() != Sale.SaleStatus.VOIDED && sale.getStatus() != Sale.SaleStatus.REFUNDED) {
            throw new BadRequestException("Запись не является возвратом");
        }
        saleAccessPolicy.assertCanView(sale);
        return sale;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
