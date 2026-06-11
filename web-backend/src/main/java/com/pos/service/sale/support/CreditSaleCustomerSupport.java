package com.pos.service.sale.support;

import com.pos.entity.Customer;
import com.pos.entity.Sale;
import com.pos.exception.PosExceptions;
import com.pos.repository.CustomerRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CreditSaleCustomerSupport {

    private final CustomerRepository customerRepository;
    private final TenantAccessSupport tenantAccess;

    public Customer resolveForCheckout(UUID customerId, Sale.ReceiptType receiptType) {
        if (receiptType == Sale.ReceiptType.CREDIT) {
            return requireForDeferred(customerId, "Для продажи в кредит укажите покупателя");
        }
        if (receiptType == Sale.ReceiptType.ADVANCE) {
            return requireForDeferred(customerId, "Для аванса укажите покупателя");
        }
        return resolveOptional(customerId);
    }

    public Customer resolveOptional(UUID customerId) {
        if (customerId == null) {
            return null;
        }
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> PosExceptions.notFound("Customer"));
        tenantAccess.assertCanAccessCompany(customer.getCompany().getId());
        return customer;
    }

    public Customer requireForCredit(UUID customerId) {
        return requireForDeferred(customerId, "Для продажи в кредит укажите покупателя");
    }

    private Customer requireForDeferred(UUID customerId, String message) {
        if (customerId == null) {
            throw PosExceptions.badRequest(message);
        }
        return resolveOptional(customerId);
    }
}
