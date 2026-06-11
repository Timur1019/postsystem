package com.pos.finance.mapper;

import com.pos.finance.dto.account.FinancialAccountDto;
import com.pos.finance.dto.audit.FinanceAuditLogDto;
import com.pos.finance.dto.category.CategoryDto;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.dto.income.IncomeDto;
import com.pos.finance.dto.transfer.AccountTransferDto;
import com.pos.finance.entity.AccountTransfer;
import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.FinanceAuditLog;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeCategory;
import org.springframework.stereotype.Component;

@Component
public class FinanceMapper {

    public FinancialAccountDto toDto(FinancialAccount entity) {
        return new FinancialAccountDto(
            entity.getId(),
            entity.getCompanyId(),
            entity.getStoreId(),
            entity.getName(),
            entity.getType(),
            entity.getBalance(),
            entity.getCurrency(),
            entity.isActive()
        );
    }

    public CategoryDto toDto(IncomeCategory entity) {
        return new CategoryDto(entity.getId(), entity.getName(), entity.isSystem(), entity.isActive());
    }

    public CategoryDto toDto(ExpenseCategory entity) {
        return new CategoryDto(entity.getId(), entity.getName(), entity.isSystem(), entity.isActive());
    }

    public IncomeDto toDto(Income entity) {
        return new IncomeDto(
            entity.getId(),
            entity.getStoreId(),
            entity.getAccount().getId(),
            entity.getAccount().getName(),
            entity.getAmount(),
            entity.getCurrency(),
            entity.getPaymentMethod(),
            entity.getIncomeCategory().getId(),
            entity.getIncomeCategory().getName(),
            entity.getSourceType(),
            entity.getSourceId(),
            entity.getComment(),
            entity.getTransactionDate()
        );
    }

    public ExpenseDto toDto(Expense entity) {
        return new ExpenseDto(
            entity.getId(),
            entity.getStoreId(),
            entity.getAccount().getId(),
            entity.getAccount().getName(),
            entity.getAmount(),
            entity.getCurrency(),
            entity.getPaymentMethod(),
            entity.getExpenseCategory().getId(),
            entity.getExpenseCategory().getName(),
            entity.getSourceType(),
            entity.getSourceId(),
            entity.getComment(),
            entity.getTransactionDate()
        );
    }

    public AccountTransferDto toDto(AccountTransfer entity) {
        return new AccountTransferDto(
            entity.getId(),
            entity.getStoreId(),
            entity.getFromAccountId(),
            entity.getFromAccountName(),
            entity.getToAccountId(),
            entity.getToAccountName(),
            entity.getAmount(),
            entity.getCurrency(),
            entity.getComment(),
            entity.getTransactionDate(),
            entity.getCreatedAt()
        );
    }

    public FinanceAuditLogDto toDto(FinanceAuditLog entity) {
        return new FinanceAuditLogDto(
            entity.getId(),
            entity.getEntityType(),
            entity.getEntityId(),
            entity.getAction(),
            entity.getSummary(),
            entity.getDetails(),
            entity.getActorId(),
            entity.getCreatedAt()
        );
    }
}
