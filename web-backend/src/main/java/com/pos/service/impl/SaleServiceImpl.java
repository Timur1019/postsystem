package com.pos.service.impl;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.SaleItemRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.CashierShift;
import com.pos.entity.Customer;
import com.pos.entity.Product;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CashierSaleSupport;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.CustomerRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.mapper.SaleMapper;
import com.pos.repository.UserRepository;
import com.pos.service.SaleService;
import com.pos.service.export.SaleExportService;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.support.SalesQuerySupport;
import com.pos.util.LogUtil;
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
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CashierSaleSupport cashierSaleSupport;
    private final CurrentUserProvider currentUserProvider;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SaleExportService saleExportService;

    @Override
    @Transactional
    public SaleResponse processSale(CreateSaleRequest req, String cashierUsername) {
        User cashier = userRepository.findByUsernameWithDetails(cashierUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));

        Store store = cashierSaleSupport.requireStoreForSale(cashier, req.storeId());

        CashierShift shift = cashierShiftRepository
            .findByCashierIdAndStoreIdAndStatus(cashier.getId(), store.getId(), CashierShift.ShiftStatus.OPEN)
            .orElseThrow(() -> new BadRequestException("Смена не открыта. Откройте смену перед продажей."));

        Customer customer = req.customerId() != null
            ? customerRepository.findById(req.customerId()).orElse(null)
            : null;

        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productRepository.findById(itemReq.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.productId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product is inactive: " + product.getName());
            }
            if (product.getStockQuantity() < itemReq.quantity()) {
                throw new BadRequestException(
                    "Insufficient stock for: " + product.getName() +
                        ". Available: " + product.getStockQuantity()
                );
            }

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice = cashierSaleSupport.resolveUnitPrice(product, store.getId());
            // Цена продажи включает НДС — извлекаем налог из суммы строки, не начисляем сверху
            BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity())).subtract(lineDiscount);
            BigDecimal rate = product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12");
            BigDecimal taxAmt = extractVatFromInclusive(lineGross, rate);
            BigDecimal netLine = lineGross.subtract(taxAmt);
            BigDecimal lineTotal = lineGross;

            SaleItem saleItem = SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .unitPrice(unitPrice)
                .quantity(itemReq.quantity())
                .discount(lineDiscount)
                .taxAmount(taxAmt.setScale(2, RoundingMode.HALF_UP))
                .lineTotal(lineTotal.setScale(2, RoundingMode.HALF_UP))
                .build();

            items.add(saleItem);

            subtotal = subtotal.add(netLine);
            taxTotal = taxTotal.add(taxAmt);
            discountTotal = discountTotal.add(lineDiscount);

            product.setStockQuantity(product.getStockQuantity() - itemReq.quantity());
            productRepository.save(product);

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType("SALE")
                .quantity(-itemReq.quantity())
                .build());
        }

        BigDecimal total = subtotal.add(taxTotal).setScale(2, RoundingMode.HALF_UP);

        Sale.ReceiptType receiptType = parseReceiptType(req.receiptType());
        Sale.CardType cardType = parseCardType(req.cardType());
        Sale.PaymentMethod paymentMethod = Sale.PaymentMethod.valueOf(req.paymentMethod());
        PaymentAmounts amounts = resolvePaymentAmounts(paymentMethod, total, req);
        if (paymentMethod == Sale.PaymentMethod.CARD && cardType == null) {
            cardType = Sale.CardType.PERSONAL;
        }
        if (amounts.card().signum() > 0 && cardType == null) {
            cardType = Sale.CardType.PERSONAL;
        }

        Sale sale = Sale.builder()
            .receiptNumber(generateReceiptNumber())
            .cashier(cashier)
            .store(store)
            .customer(customer)
            .cashierShift(shift)
            .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
            .taxTotal(taxTotal.setScale(2, RoundingMode.HALF_UP))
            .discountTotal(discountTotal.setScale(2, RoundingMode.HALF_UP))
            .totalAmount(total)
            .paymentMethod(paymentMethod)
            .cashAmount(amounts.cash())
            .cardAmount(amounts.card())
            .receiptType(receiptType)
            .cardType(cardType)
            .amountTendered(amounts.tendered())
            .changeGiven(amounts.change())
            .status(Sale.SaleStatus.COMPLETED)
            .notes(req.notes())
            .build();

        items.forEach(item -> item.setSale(sale));
        sale.setItems(items);

        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        LogUtil.info(SaleServiceImpl.class, "Sale completed: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return toResponse(saved);
    }

    @Override
    public SaleResponse getSale(UUID id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
        assertCanViewSale(sale);
        return toResponse(sale);
    }

    @Override
    public SaleResponse getByReceiptNumber(String receiptNumber) {
        Sale sale = saleRepository.findByReceiptNumber(receiptNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Receipt not found"));
        assertCanViewSale(sale);
        return toResponse(sale);
    }

    private void assertCanViewSale(Sale sale) {
        User actor = currentUserProvider.requireCurrentUser();
        if (currentUserProvider.isSuperAdmin(actor) || currentUserProvider.isTenantAdmin(actor)) {
            return;
        }
        if ("MANAGER".equals(actor.getRole().getName())) {
            return;
        }
        if (!sale.getCashier().getId().equals(actor.getId())) {
            throw new BadRequestException("Access denied");
        }
    }

    private void assertCanVoidSale(Sale sale) {
        User actor = currentUserProvider.requireCurrentUser();
        if (currentUserProvider.isSuperAdmin(actor) || currentUserProvider.isTenantAdmin(actor)) {
            return;
        }
        if ("MANAGER".equals(actor.getRole().getName())) {
            return;
        }
        if ("CASHIER".equals(actor.getRole().getName()) && sale.getCashier().getId().equals(actor.getId())) {
            return;
        }
        throw new BadRequestException("Нет прав на возврат этого чека");
    }

    @Override
    public PageResponse<SaleResponse> getSales(
        LocalDate from,
        LocalDate to,
        String cashierId,
        String search,
        String receiptNumber,
        String saleIdStr,
        String cashierName,
        String paymentMethodStr,
        String statusStr,
        String paymentSettlement,
        String storeIdStr,
        Pageable pageable
    ) {
        Optional<SalesQuerySupport.SalesFilter> filters = SalesQuerySupport.buildFilters(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr
        );
        if (filters.isEmpty()) {
            return PageResponse.from(Page.empty(pageable));
        }
        var f = filters.get();

        UUID saleUuid = f.saleId();
        Optional<PageResponse<SaleResponse>> cached = salesLedgerCacheService.trySearch(
            from,
            to,
            f.cashierId(),
            f.q(),
            f.receipt(),
            saleUuid,
            f.cashierName(),
            f.paymentMethod() != null ? f.paymentMethod().name() : null,
            f.status() != null ? f.status().name() : null,
            paymentSettlement,
            f.storeId(),
            pageable
        );
        if (cached.isPresent()) {
            return cached.get();
        }

        Page<Sale> page = saleRepository.searchSales(
            f.start(), f.end(), f.cashierId(), f.receipt(), f.cashierName(), f.q(),
            f.paymentMethod(), f.status(), f.saleId(), f.paymentSettlement(), f.storeId(), pageable
        );
        return PageResponse.from(page.map(saleMapper::toSummaryResponse));
    }

    @Override
    public byte[] exportSoldLinesExcel(
        LocalDate from,
        LocalDate to,
        String cashierId,
        String search,
        String receiptNumber,
        String saleIdStr,
        String cashierName,
        String paymentMethodStr,
        String statusStr,
        String paymentSettlement,
        String storeIdStr
    ) {
        return saleExportService.exportSoldLinesExcel(
            from, to, cashierId, search, receiptNumber, saleIdStr, cashierName,
            paymentMethodStr, statusStr, paymentSettlement, storeIdStr
        );
    }

    @Override
    public PageResponse<SaleResponse> getSalesByCashier(
        String username,
        UUID shiftId,
        UUID excludeShiftId,
        String receiptNumber,
        String paymentMethodStr,
        String statusStr,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        Sale.PaymentMethod paymentMethod = parseMySalesPaymentMethod(paymentMethodStr);
        Sale.SaleStatus status = parseMySalesStatus(statusStr);
        String receipt = receiptNumber != null && !receiptNumber.isBlank() ? receiptNumber.trim() : null;
        ZoneId zone = ZoneId.systemDefault();
        Instant dateFrom = from != null ? from.atStartOfDay(zone).toInstant() : null;
        Instant dateTo = to != null ? to.plusDays(1).atStartOfDay(zone).toInstant() : null;

        Page<Sale> page = saleRepository.searchCashierSales(
            username,
            shiftId,
            excludeShiftId,
            receipt,
            paymentMethod,
            status,
            dateFrom,
            dateTo,
            pageable
        );
        return PageResponse.from(page.map(saleMapper::toSummaryResponse));
    }

    private static Sale.PaymentMethod parseMySalesPaymentMethod(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Sale.PaymentMethod.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static Sale.SaleStatus parseMySalesStatus(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Sale.SaleStatus.valueOf(s.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Override
    @Transactional
    public SaleResponse voidSale(UUID id, String reason) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        assertCanVoidSale(sale);

        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            throw new BadRequestException("Sale already voided");
        }

        sale.setStatus(Sale.SaleStatus.VOIDED);
        String r = reason != null ? reason : "";
        String prev = sale.getNotes();
        sale.setNotes(prev != null && !prev.isBlank() ? prev + " | VOID: " + r : "VOID: " + r);

        sale.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType("RETURN")
                .quantity(item.getQuantity())
                .referenceId(sale.getId())
                .notes("Void: " + r)
                .build());
        });

        Sale saved = saleRepository.save(sale);
        salesLedgerCacheService.onSaleChanged(saved);
        LogUtil.info(SaleServiceImpl.class, "Sale voided: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return toResponse(saved);
    }

    private record PaymentAmounts(
        BigDecimal cash,
        BigDecimal card,
        BigDecimal tendered,
        BigDecimal change
    ) {}

    private PaymentAmounts resolvePaymentAmounts(
        Sale.PaymentMethod paymentMethod,
        BigDecimal total,
        CreateSaleRequest req
    ) {
        return switch (paymentMethod) {
            case CASH -> {
                BigDecimal cash = scale(total);
                BigDecimal tendered = scale(req.amountTendered() != null ? req.amountTendered() : total);
                if (tendered.compareTo(cash) < 0) {
                    throw new BadRequestException("Получено наличными меньше суммы оплаты");
                }
                yield new PaymentAmounts(cash, BigDecimal.ZERO, tendered, tendered.subtract(cash).max(BigDecimal.ZERO));
            }
            case CARD, MPESA -> {
                BigDecimal card = scale(total);
                yield new PaymentAmounts(BigDecimal.ZERO, card, card, BigDecimal.ZERO);
            }
            case MIXED -> resolveMixedPayment(total, req);
        };
    }

    private PaymentAmounts resolveMixedPayment(BigDecimal total, CreateSaleRequest req) {
        if (req.cashAmount() == null) {
            throw new BadRequestException("Укажите сумму наличными для смешанной оплаты");
        }
        BigDecimal cash = scale(req.cashAmount());
        if (cash.signum() < 0) {
            throw new BadRequestException("Суммы оплаты не могут быть отрицательными");
        }
        if (cash.compareTo(total) > 0) {
            throw new BadRequestException("Наличная часть не может превышать сумму к оплате");
        }
        BigDecimal card = scale(total.subtract(cash));
        if (cash.signum() == 0 && card.signum() == 0) {
            throw new BadRequestException("Укажите хотя бы одну сумму оплаты");
        }
        BigDecimal tendered = cash.signum() > 0
            ? scale(req.amountTendered() != null ? req.amountTendered() : cash)
            : BigDecimal.ZERO;
        if (cash.signum() > 0 && tendered.compareTo(cash) < 0) {
            throw new BadRequestException("Получено наличными меньше наличной части");
        }
        BigDecimal change = cash.signum() > 0 ? tendered.subtract(cash).max(BigDecimal.ZERO) : BigDecimal.ZERO;
        return new PaymentAmounts(cash, card, tendered, change);
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    /** НДС внутри суммы: amount × rate / (100 + rate) */
    private static BigDecimal extractVatFromInclusive(BigDecimal inclusiveAmount, BigDecimal ratePercent) {
        if (inclusiveAmount == null || inclusiveAmount.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = ratePercent != null ? ratePercent : BigDecimal.ZERO;
        if (rate.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return inclusiveAmount
            .multiply(rate)
            .divide(rate.add(BigDecimal.valueOf(100)), 8, RoundingMode.HALF_UP);
    }

    private static Sale.ReceiptType parseReceiptType(String raw) {
        if (raw == null || raw.isBlank()) {
            return Sale.ReceiptType.SALE;
        }
        return Sale.ReceiptType.valueOf(raw.trim().toUpperCase());
    }

    private static Sale.CardType parseCardType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return Sale.CardType.valueOf(raw.trim().toUpperCase());
    }

    private String generateReceiptNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String prefix = "RCP-" + date + "-";
        long seq = saleRepository.countByReceiptNumberStartingWith(prefix);
        return prefix + String.format("%04d", seq + 1);
    }

    private SaleResponse toResponse(Sale sale) {
        return saleMapper.toResponse(sale);
    }
}
