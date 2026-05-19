package com.pos.service.sale;

import com.pos.entity.Sale;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SaleAccessPolicy {

    private final CurrentUserProvider currentUserProvider;

    public void assertCanView(Sale sale) {
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

    public void assertCanVoid(Sale sale) {
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
}
