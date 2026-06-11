package com.pos.finance.service.impl;

import com.pos.finance.dto.audit.FinanceAuditLogDto;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.FinanceAuditEntityType;
import com.pos.finance.mapper.FinanceMapper;
import com.pos.finance.repository.FinanceAuditLogRepository;
import com.pos.finance.security.FinanceTenantContext;
import com.pos.finance.service.FinanceAuditService;
import com.pos.finance.service.support.CompanyBootstrapSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinanceAuditServiceImpl implements FinanceAuditService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private final FinanceAuditLogRepository auditLogRepository;
    private final FinanceMapper mapper;
    private final CompanyBootstrapSupport bootstrapSupport;

    @Override
    public PageResponse<FinanceAuditLogDto> list(
        FinanceAuditEntityType entityType,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        Integer companyId = FinanceTenantContext.requireCompanyId();
        bootstrapSupport.ensureBootstrapped(companyId);
        Instant fromInstant = from != null ? from.atStartOfDay(ZONE).toInstant() : null;
        Instant toInstant = to != null ? to.plusDays(1).atStartOfDay(ZONE).toInstant() : null;
        return PageResponse.from(
            auditLogRepository.search(companyId, entityType, fromInstant, toInstant, pageable)
                .map(mapper::toDto)
        );
    }
}
