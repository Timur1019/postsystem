package com.pos.service;

import com.pos.entity.User;

public interface AuditService {

    void log(User user, String action, String entityType, String entityId, String oldValue, String newValue);
}
