package com.pos.finance.service;

import com.pos.finance.dto.audit.FinanceAuditLogDto;
import com.pos.finance.dto.shared.PageResponse;
import com.pos.finance.entity.FinanceAuditEntityType;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface FinanceAuditService {

    PageResponse<FinanceAuditLogDto> list(FinanceAuditEntityType entityType, LocalDate from, LocalDate to, Pageable pageable);
}
