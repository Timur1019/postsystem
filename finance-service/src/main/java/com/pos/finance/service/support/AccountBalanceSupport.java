package com.pos.finance.service.support;

import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.repository.FinancialAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AccountBalanceSupport {

    private final FinancialAccountRepository accountRepository;

    public FinancialAccount requireAccount(UUID accountId, Integer companyId) {
        return accountRepository.findByIdAndCompanyIdAndDeletedFalse(accountId, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("FinancialAccount", accountId));
    }

    public void credit(FinancialAccount account, BigDecimal amount) {
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
    }

    public void debit(FinancialAccount account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw FinanceExceptions.badRequest("Недостаточно средств на счёте: " + account.getName());
        }
        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);
    }
}
