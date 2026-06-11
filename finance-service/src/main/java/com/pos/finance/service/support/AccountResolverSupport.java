package com.pos.finance.service.support;

import com.pos.finance.entity.AccountType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.repository.FinancialAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AccountResolverSupport {

    private final FinancialAccountRepository accountRepository;

    public FinancialAccount resolveOrCreate(Integer companyId, Integer storeId, AccountType type) {
        return accountRepository.findFirstByCompanyIdAndStoreIdAndTypeAndDeletedFalse(companyId, storeId, type)
            .or(() -> accountRepository.findFirstByCompanyIdAndStoreIdIsNullAndTypeAndDeletedFalse(companyId, type))
            .orElseGet(() -> accountRepository.save(FinancialAccount.builder()
                .companyId(companyId)
                .storeId(storeId)
                .name(defaultName(type))
                .type(type)
                .balance(BigDecimal.ZERO)
                .currency("UZS")
                .active(true)
                .deleted(false)
                .build()));
    }

    private static String defaultName(AccountType type) {
        return switch (type) {
            case CASH -> "Касса (наличные)";
            case CARD -> "Терминал (карта)";
            case BANK -> "Банковский счёт";
            case CLICK -> "Click";
            case PAYME -> "Payme";
            case UZUM -> "Uzum";
            case OTHER -> "Прочий счёт";
        };
    }
}
