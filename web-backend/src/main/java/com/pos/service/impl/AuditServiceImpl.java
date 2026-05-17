package com.pos.service.impl;

import com.pos.entity.AuditLog;
import com.pos.entity.User;
import com.pos.repository.AuditLogRepository;
import com.pos.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void log(User user, String action, String entityType, String entityId, String oldValue, String newValue) {
        AuditLog entry = AuditLog.builder()
            .user(user)
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .build();
        auditLogRepository.save(entry);
    }
}
