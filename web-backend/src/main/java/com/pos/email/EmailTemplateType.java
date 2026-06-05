package com.pos.email;

import java.util.List;

public enum EmailTemplateType {
    USER_CREDENTIALS(
        "user-credentials",
        "Данные для входа",
        "Отправляется автоматически при создании пользователя",
        List.of("fullName", "username", "password", "role", "companyName", "companyLoginCode", "loginUrl")
    ),
    SUPER_ADMIN_LOGIN(
        "super-admin-login",
        "Вход супер-админа",
        "Отправляется при входе пользователя с ролью SUPER_ADMIN",
        List.of("fullName", "username", "email", "loginTime", "ipAddress", "userAgent")
    ),
    BROADCAST(
        "broadcast",
        "Рассылка",
        "Произвольное сообщение выбранным пользователям",
        List.of("recipientName", "subject", "message")
    );

    private final String fileName;
    private final String title;
    private final String description;
    private final List<String> variables;

    EmailTemplateType(String fileName, String title, String description, List<String> variables) {
        this.fileName = fileName;
        this.title = title;
        this.description = description;
        this.variables = variables;
    }

    public String fileName() {
        return fileName;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public List<String> variables() {
        return variables;
    }
}
