package com.pos.finance.service.impl;

import com.pos.finance.dto.expense.CreateExpenseRequest;
import com.pos.finance.dto.expense.ExpenseDto;
import com.pos.finance.dto.expense.UpdateExpenseRequest;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.Expense;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.ExpenseSourceType;
import com.pos.finance.entity.FinanceAuditAction;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.entity.FinancialAccount;
import com.pos.finance.entity.PaymentMethod;
import com.pos.finance.exception.FinanceExceptions;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.ExpenseCategoryRepository;
import com.pos.finance.repository.ExpenseRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.ExpenseService;
import com.pos.finance.service.support.AccountBalanceSupport;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import com.pos.finance.service.support.FinanceAuditSupport;
import com.pos.finance.util.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;
    private final FinanceMapper mapper;
    private final CompanyBootstrapSupport bootstrapSupport;
    private final AccountBalanceSupport balanceSupport;
    private final FinanceAuditSupport auditSupport;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ExpenseDto> list(
        Integer storeId, LocalDate from, LocalDate to, UUID categoryId, PaymentMethod paymentMethod, Pageable pageable
    ) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        return PageResponse.from(
            expenseRepository.search(companyId, storeId, from, to, categoryId, paymentMethod, pageable)
                .map(mapper::toDto)
        );
    }

    @Override
    public ExpenseDto create(CreateExpenseRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        FinancialAccount account = balanceSupport.requireAccount(request.accountId(), companyId);
        ExpenseCategory category = expenseCategoryRepository.findByIdAndCompanyId(request.expenseCategoryId(), companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("ExpenseCategory", request.expenseCategoryId()));
        if (!category.isActive()) {
            throw FinanceExceptions.badRequest("Категория расхода отключена");
        }
        balanceSupport.debit(account, request.amount());
        ExpenseSourceType sourceType = resolveSourceType(request, category);
        Expense expense = Expense.builder()
            .companyId(companyId)
            .storeId(request.storeId())
            .account(account)
            .amount(request.amount())
            .currency(request.currency() != null ? request.currency() : "UZS")
            .paymentMethod(request.paymentMethod())
            .expenseCategory(category)
            .supplierId(request.supplierId())
            .employeeId(request.employeeId())
            .sourceType(sourceType)
            .comment(request.comment())
            .transactionDate(request.transactionDate() != null ? request.transactionDate() : LocalDate.now())
            .deleted(false)
            .createdBy(FinanceTenantContext.userId().orElse(null))
            .build();
        Expense saved = expenseRepository.save(expense);
        auditSupport.log(
            FinanceAuditAction.CREATE,
            FinanceAuditEntityType.EXPENSE,
            saved.getId(),
            "Расход: " + category.getName() + " " + saved.getAmount(),
            null
        );
        LogUtil.info(ExpenseServiceImpl.class, "Expense created: id={}, amount={}", saved.getId(), saved.getAmount());
        return mapper.toDto(saved);
    }

    @Override
    public ExpenseDto update(UUID id, UpdateExpenseRequest request) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        Expense expense = expenseRepository.findByIdAndCompanyIdAndDeletedFalse(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("Expense", id));
        FinancialAccount oldAccount = expense.getAccount();
        FinancialAccount newAccount = balanceSupport.requireAccount(request.accountId(), companyId);
        ExpenseCategory category = expenseCategoryRepository.findByIdAndCompanyId(request.expenseCategoryId(), companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("ExpenseCategory", request.expenseCategoryId()));

        BigDecimal oldAmount = expense.getAmount();
        BigDecimal newAmount = request.amount();
        if (!oldAccount.getId().equals(newAccount.getId())) {
            balanceSupport.credit(oldAccount, oldAmount);
            balanceSupport.debit(newAccount, newAmount);
        } else {
            BigDecimal delta = newAmount.subtract(oldAmount);
            if (delta.signum() > 0) {
                balanceSupport.debit(oldAccount, delta);
            } else if (delta.signum() < 0) {
                balanceSupport.credit(oldAccount, delta.abs());
            }
        }

        expense.setAccount(newAccount);
        expense.setAmount(newAmount);
        expense.setExpenseCategory(category);
        expense.setPaymentMethod(request.paymentMethod());
        expense.setStoreId(request.storeId());
        expense.setComment(request.comment());
        expense.setTransactionDate(request.transactionDate() != null ? request.transactionDate() : expense.getTransactionDate());
        expense.setUpdatedBy(FinanceTenantContext.userId().orElse(null));
        Expense saved = expenseRepository.save(expense);
        auditSupport.log(
            FinanceAuditAction.UPDATE,
            FinanceAuditEntityType.EXPENSE,
            saved.getId(),
            "Изменён расход: " + saved.getAmount(),
            null
        );
        return mapper.toDto(saved);
    }

    @Override
    public void delete(UUID id) {
        if (!FinanceTenantContext.isFinanceAdmin()) {
            throw FinanceExceptions.forbidden("Удаление расходов доступно только FINANCE_ADMIN");
        }
        Integer companyId = FinanceTenantContext.requireCompanyId();
        Expense expense = expenseRepository.findByIdAndCompanyIdAndDeletedFalse(id, companyId)
            .orElseThrow(() -> FinanceExceptions.notFound("Expense", id));
        balanceSupport.credit(expense.getAccount(), expense.getAmount());
        expense.setDeleted(true);
        expense.setUpdatedBy(FinanceTenantContext.userId().orElse(null));
        expenseRepository.save(expense);
        auditSupport.log(
            FinanceAuditAction.DELETE,
            FinanceAuditEntityType.EXPENSE,
            expense.getId(),
            "Удалён расход: " + expense.getAmount(),
            null
        );
        LogUtil.info(ExpenseServiceImpl.class, "Expense soft-deleted: id={}", id);
    }

    private static ExpenseSourceType resolveSourceType(CreateExpenseRequest request, ExpenseCategory category) {
        if (request.sourceType() != null) {
            return request.sourceType();
        }
        if ("Зарплата".equals(category.getName())) {
            return ExpenseSourceType.SALARY;
        }
        return ExpenseSourceType.MANUAL;
    }
}
