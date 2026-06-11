package com.pos.finance.controller;

import com.pos.finance.dto.integration.AdvanceSaleDepositRequest;
import com.pos.finance.dto.integration.CreditPurchasePayableRequest;
import com.pos.finance.dto.integration.CreditSaleReceivableRequest;
import com.pos.finance.dto.integration.PurchaseExpenseRequest;
import com.pos.finance.dto.integration.RefundExpenseRequest;
import com.pos.finance.dto.integration.SaleAdvanceApplyRequest;
import com.pos.finance.dto.integration.SaleIncomeRequest;
import com.pos.finance.service.CustomerAdvanceService;
import com.pos.finance.service.AdvanceSaleIntegrationService;
import com.pos.finance.service.CreditPurchaseIntegrationService;
import com.pos.finance.service.CreditSaleIntegrationService;
import com.pos.finance.service.PurchaseIntegrationService;
import com.pos.finance.service.ReturnIntegrationService;
import com.pos.finance.service.SaleIntegrationService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/finance")
@RequiredArgsConstructor
@Hidden
public class InternalIntegrationController {

    private final SaleIntegrationService saleIntegrationService;
    private final PurchaseIntegrationService purchaseIntegrationService;
    private final ReturnIntegrationService returnIntegrationService;
    private final CreditSaleIntegrationService creditSaleIntegrationService;
    private final CreditPurchaseIntegrationService creditPurchaseIntegrationService;
    private final AdvanceSaleIntegrationService advanceSaleIntegrationService;
    private final CustomerAdvanceService customerAdvanceService;

    @PostMapping("/incomes/from-sale")
    public ResponseEntity<Void> recordSaleIncome(@Valid @RequestBody SaleIncomeRequest request) {
        saleIntegrationService.recordSaleIncome(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/expenses/from-purchase")
    public ResponseEntity<Void> recordPurchaseExpense(@Valid @RequestBody PurchaseExpenseRequest request) {
        purchaseIntegrationService.recordPurchaseExpense(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/expenses/from-refund")
    public ResponseEntity<Void> recordRefundExpense(@Valid @RequestBody RefundExpenseRequest request) {
        returnIntegrationService.recordRefundExpense(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/receivables/from-credit-sale")
    public ResponseEntity<Void> recordCreditSale(@Valid @RequestBody CreditSaleReceivableRequest request) {
        creditSaleIntegrationService.recordCreditSale(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/payables/from-credit-purchase")
    public ResponseEntity<Void> recordCreditPurchase(@Valid @RequestBody CreditPurchasePayableRequest request) {
        creditPurchaseIntegrationService.recordCreditPurchase(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/advances/from-advance-sale")
    public ResponseEntity<Void> recordAdvanceSale(@Valid @RequestBody AdvanceSaleDepositRequest request) {
        advanceSaleIntegrationService.recordAdvanceDeposit(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/advances/from-sale-payment")
    public ResponseEntity<Void> recordSaleAdvancePayment(@Valid @RequestBody SaleAdvanceApplyRequest request) {
        customerAdvanceService.applyAdvanceFromSale(request);
        return ResponseEntity.accepted().build();
    }
}
