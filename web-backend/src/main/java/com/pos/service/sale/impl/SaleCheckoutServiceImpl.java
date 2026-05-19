package com.pos.service.sale.impl;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.SaleItemRequest;
import com.pos.dto.sale.SaleResponse;
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
import com.pos.mapper.SaleMapper;
import com.pos.repository.CashierShiftRepository;
import com.pos.repository.CustomerRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleRepository;
import com.pos.repository.StockMovementRepository;
import com.pos.repository.UserRepository;
import com.pos.service.sale.SaleCheckoutService;
import com.pos.service.sale.support.SaleEnumParser;
import com.pos.service.sale.support.SalePaymentResolver;
import com.pos.service.sale.support.SaleReceiptNumberGenerator;
import com.pos.service.sale.support.SaleVatCalculator;
import com.pos.service.salesledger.SalesLedgerCacheService;
import com.pos.service.support.CashierSaleSupport;
import com.pos.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SaleCheckoutServiceImpl implements SaleCheckoutService {

    private final SaleRepository saleRepository;
    private final CashierShiftRepository cashierShiftRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CashierSaleSupport cashierSaleSupport;
    private final SaleMapper saleMapper;
    private final SalesLedgerCacheService salesLedgerCacheService;
    private final SalePaymentResolver paymentResolver;
    private final SaleReceiptNumberGenerator receiptNumberGenerator;

    @Override
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
            BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity())).subtract(lineDiscount);
            BigDecimal rate = product.getTaxRate() != null ? product.getTaxRate() : new BigDecimal("12");
            BigDecimal taxAmt = SaleVatCalculator.extractFromInclusive(lineGross, rate);
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

        Sale.ReceiptType receiptType = SaleEnumParser.receiptType(req.receiptType());
        Sale.CardType cardType = SaleEnumParser.cardType(req.cardType());
        Sale.PaymentMethod paymentMethod = Sale.PaymentMethod.valueOf(req.paymentMethod());
        SalePaymentResolver.PaymentAmounts amounts = paymentResolver.resolve(paymentMethod, total, req);
        if (paymentMethod == Sale.PaymentMethod.CARD && cardType == null) {
            cardType = Sale.CardType.PERSONAL;
        }
        if (amounts.card().signum() > 0 && cardType == null) {
            cardType = Sale.CardType.PERSONAL;
        }

        Sale sale = Sale.builder()
            .receiptNumber(receiptNumberGenerator.next())
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
        LogUtil.info(SaleCheckoutServiceImpl.class, "Sale completed: id={}, receipt={}", saved.getId(), saved.getReceiptNumber());
        return saleMapper.toResponse(saved);
    }
}
