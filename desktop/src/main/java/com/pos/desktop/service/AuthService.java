package com.pos.desktop.service;

import com.pos.desktop.dao.UserDao;
import com.pos.desktop.model.User;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.SQLException;
import java.util.Optional;

/**
 * Handles local authentication for the desktop POS.
 * Uses BCrypt for password verification (no network required).
 */
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserDao userDao = new UserDao();

    public User login(String username, String password) throws AuthException {
        try {
            Optional<User> userOpt = userDao.findByUsername(username);
            if (userOpt.isEmpty()) {
                log.warn("Login attempt for unknown user: {}", username);
                throw new AuthException("Invalid username or password");
            }

            User user = userOpt.get();

            if (!user.isActive()) {
                throw new AuthException("Account is disabled. Contact your administrator.");
            }

            if (!BCrypt.checkpw(password, user.getPassword())) {
                log.warn("Failed login attempt for: {}", username);
                throw new AuthException("Invalid username or password");
            }

            SessionService.getInstance().setCurrentUser(user);
            log.info("User logged in: {} ({})", username, user.getRole());
            return user;

        } catch (SQLException e) {
            throw new AuthException("Database error during login", e);
        }
    }

    public void logout() {
        String username = SessionService.getInstance().getCurrentUser() != null
            ? SessionService.getInstance().getCurrentUser().getUsername() : "unknown";
        SessionService.getInstance().clearSession();
        log.info("User logged out: {}", username);
    }

    public static String hashPassword(String plain) {
        return BCrypt.hashpw(plain, BCrypt.gensalt(10));
    }

    public static class AuthException extends Exception {
        public AuthException(String msg) {
            super(msg);
        }

        public AuthException(String msg, Throwable cause) {
            super(msg, cause);
        }
    }
}
