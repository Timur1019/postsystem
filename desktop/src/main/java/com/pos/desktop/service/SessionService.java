package com.pos.desktop.service;

import com.pos.desktop.model.User;

public class SessionService {

    private static SessionService INSTANCE;
    private User currentUser;

    private SessionService() {}

    public static synchronized SessionService getInstance() {
        if (INSTANCE == null) INSTANCE = new SessionService();
        return INSTANCE;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(User user) {
        this.currentUser = user;
    }

    public void clearSession() {
        this.currentUser = null;
    }

    public boolean isLoggedIn() {
        return currentUser != null;
    }

    public boolean isAdmin() {
        return currentUser != null && currentUser.isAdmin();
    }
}
