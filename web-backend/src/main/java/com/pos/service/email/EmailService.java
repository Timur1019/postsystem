package com.pos.service.email;

import com.pos.entity.User;

public interface EmailService {

    void sendUserCredentials(User user, String rawPassword);

    void notifySuperAdminLogin(User user, String ipAddress, String userAgent);

    void sendHtml(String to, String subject, String html);
}
