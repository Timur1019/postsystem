package com.pos.desktop.model;

import lombok.Data;

@Data
public class User {
    private String  id;
    private String  username;
    private String  password;
    private String  fullName;
    private String  role;
    private boolean active;
    private String  createdAt;

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
