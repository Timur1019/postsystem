package com.pos.service.cashier.support;

import com.pos.entity.CashierShift;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CashierShiftRepository;
import com.pos.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CashierShiftAccessPolicy {

    private final CashierShiftRepository cashierShiftRepository;
    private final CurrentUserProvider currentUserProvider;

    public CashierShift requireOwned(UUID shiftId) {
        User actor = currentUserProvider.requireCurrentUser();
        CashierShift shift = cashierShiftRepository.findById(shiftId)
            .orElseThrow(() -> new ResourceNotFoundException("Смена не найдена"));
        if (!shift.getCashier().getId().equals(actor.getId())) {
            throw new BadRequestException("Доступ к смене запрещён");
        }
        return shift;
    }
}
