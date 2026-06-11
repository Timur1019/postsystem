package com.pos.finance.service.support;

import com.pos.finance.entity.FinanceAuditAction;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.entity.FinanceAuditLog;
import com.pos.finance.repository.FinanceAuditLogRepository;
import com.pos.finance.security.FinanceTenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FinanceAuditSupport {

    private final FinanceAuditLogRepository auditLogRepository;

    public void log(
        FinanceAuditAction action,
        FinanceAuditEntityType entityType,
        UUID entityId,
        String summary,
        String details
    ) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        auditLogRepository.save(FinanceAuditLog.builder()
            .companyId(companyId)
            .entityType(entityType)
            .entityId(entityId)
            .action(action)
            .summary(summary)
            .details(details)
            .actorId(FinanceTenantContext.userId().orElse(null))
            .build());
    }
}
