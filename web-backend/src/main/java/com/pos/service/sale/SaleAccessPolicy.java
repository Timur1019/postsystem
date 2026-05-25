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
        if (isAdminLevel(actor) || currentUserProvider.isManager(actor)) {
            return;
        }
        if (!isOwner(actor, sale)) {
            throw new BadRequestException("Access denied");
        }
    }

    public void assertCanVoid(Sale sale) {
        User actor = currentUserProvider.requireCurrentUser();
        if (isAdminLevel(actor) || currentUserProvider.isManager(actor)) {
            return;
        }
        if (currentUserProvider.isCashier(actor) && isOwner(actor, sale)) {
            return;
        }
        throw new BadRequestException("Нет прав на возврат этого чека");
    }

    private boolean isAdminLevel(User actor) {
        return currentUserProvider.isSuperAdmin(actor) || currentUserProvider.isTenantAdmin(actor);
    }

    private static boolean isOwner(User actor, Sale sale) {
        return sale.getCashier() != null && sale.getCashier().getId().equals(actor.getId());
    }
}
