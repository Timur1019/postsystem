package com.pos.desktop.dao;

import com.pos.desktop.model.User;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class UserDao {

    private final DatabaseManager db = DatabaseManager.getInstance();

    public Optional<User> findByUsername(String username) throws SQLException {
        String sql = """
            SELECT id, username, password, full_name, role, is_active, created_at
            FROM users WHERE username = ?
            """;
        try (PreparedStatement ps = db.getConnection().prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return Optional.empty();
                User u = new User();
                u.setId(rs.getString("id"));
                u.setUsername(rs.getString("username"));
                u.setPassword(rs.getString("password"));
                u.setFullName(rs.getString("full_name"));
                u.setRole(rs.getString("role"));
                u.setActive(rs.getInt("is_active") == 1);
                u.setCreatedAt(rs.getString("created_at"));
                return Optional.of(u);
            }
        }
    }
}
