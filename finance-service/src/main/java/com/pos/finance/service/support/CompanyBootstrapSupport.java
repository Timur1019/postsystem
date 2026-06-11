package com.pos.finance.service.support;

import com.pos.finance.entity.CompanyFinanceBootstrap;
import com.pos.finance.entity.ExpenseCategory;
import com.pos.finance.entity.IncomeCategory;
import com.pos.finance.repository.CompanyFinanceBootstrapRepository;
import com.pos.finance.repository.ExpenseCategoryRepository;
import com.pos.finance.repository.IncomeCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CompanyBootstrapSupport {

    private static final List<String> DEFAULT_INCOME_CATEGORIES = List.of(
        "Продажи",
        "Ручной приход",
        "Оплата долга клиентом",
        "Внесение владельцем",
        "Возврат от поставщика",
        "Прочий доход"
    );

    private static final List<String> DEFAULT_EXPENSE_CATEGORIES = List.of(
        "Закуп товара",
        "Зарплата",
        "Аренда",
        "Коммунальные услуги",
        "Налоги",
        "Доставка",
        "Реклама",
        "Ремонт",
        "Канцелярия",
        "Возврат клиенту",
        "Прочее",
        "Оплата поставщику"
    );

    private final CompanyFinanceBootstrapRepository bootstrapRepository;
    private final IncomeCategoryRepository incomeCategoryRepository;
    private final ExpenseCategoryRepository expenseCategoryRepository;

    @Transactional
    public void ensureBootstrapped(Integer companyId) {
        seedCategories(companyId);
        if (bootstrapRepository.existsById(companyId)) {
            return;
        }
        bootstrapRepository.save(CompanyFinanceBootstrap.builder()
            .companyId(companyId)
            .bootstrappedAt(Instant.now())
            .build());
    }

    private void seedCategories(Integer companyId) {
        for (String name : DEFAULT_INCOME_CATEGORIES) {
            incomeCategoryRepository.findByCompanyIdAndName(companyId, name).orElseGet(() ->
                incomeCategoryRepository.save(IncomeCategory.builder()
                    .companyId(companyId)
                    .name(name)
                    .type("INCOME")
                    .system(true)
                    .active(true)
                    .build())
            );
        }
        for (String name : DEFAULT_EXPENSE_CATEGORIES) {
            expenseCategoryRepository.findByCompanyIdAndName(companyId, name).orElseGet(() ->
                expenseCategoryRepository.save(ExpenseCategory.builder()
                    .companyId(companyId)
                    .name(name)
                    .type("EXPENSE")
                    .system(true)
                    .active(true)
                    .build())
            );
        }
    }

    public IncomeCategory requireSalesCategory(Integer companyId) {
        return incomeCategoryRepository.findByCompanyIdAndName(companyId, "Продажи")
            .orElseThrow(() -> new IllegalStateException("Sales income category missing for company " + companyId));
    }

    public ExpenseCategory requirePurchaseCategory(Integer companyId) {
        return expenseCategoryRepository.findByCompanyIdAndName(companyId, "Закуп товара")
            .orElseThrow(() -> new IllegalStateException("Purchase expense category missing for company " + companyId));
    }

    public ExpenseCategory requireRefundCategory(Integer companyId) {
        return expenseCategoryRepository.findByCompanyIdAndName(companyId, "Возврат клиенту")
            .orElseThrow(() -> new IllegalStateException("Refund expense category missing for company " + companyId));
    }

    public IncomeCategory requireClientDebtPaymentCategory(Integer companyId) {
        return incomeCategoryRepository.findByCompanyIdAndName(companyId, "Оплата долга клиентом")
            .orElseThrow(() -> new IllegalStateException("Client debt payment category missing for company " + companyId));
    }

    public ExpenseCategory requireSupplierPaymentCategory(Integer companyId) {
        return expenseCategoryRepository.findByCompanyIdAndName(companyId, "Оплата поставщику")
            .orElseThrow(() -> new IllegalStateException("Supplier payment category missing for company " + companyId));
    }
}

