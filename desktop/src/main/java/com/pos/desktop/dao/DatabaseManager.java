package com.pos.desktop.dao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Singleton SQLite connection manager.
 * Uses a single connection with WAL mode for lightweight desktop use.
 * For higher throughput, replace with HikariCP + SQLite pool.
 */
public class DatabaseManager {

    private static final Logger log = LoggerFactory.getLogger(DatabaseManager.class);
    private static DatabaseManager INSTANCE;

    // Store DB in user's home dir for portability
    private static final String DB_DIR  = System.getProperty("user.home") + "/.retailpos";
    private static final String DB_FILE = DB_DIR + "/pos.db";
    private static final String DB_URL  = "jdbc:sqlite:" + DB_FILE;

    private Connection connection;

    private DatabaseManager() {}

    public static synchronized DatabaseManager getInstance() {
        if (INSTANCE == null) INSTANCE = new DatabaseManager();
        return INSTANCE;
    }

    public void initialize() {
        try {
            // Ensure directory exists
            Path dbDir = Paths.get(DB_DIR);
            if (!Files.exists(dbDir)) Files.createDirectories(dbDir);

            // Load driver
            Class.forName("org.sqlite.JDBC");

            // Open connection
            connection = DriverManager.getConnection(DB_URL);
            connection.setAutoCommit(true);

            // Run schema
            runSchema();

            log.info("Database initialized at {}", DB_FILE);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize database", e);
        }
    }

    private void runSchema() throws Exception {
        InputStream is = getClass().getResourceAsStream("/schema.sql");
        if (is == null) throw new IllegalStateException("schema.sql not found on classpath");

        String sql = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))
            .lines().collect(Collectors.joining("\n"));

        try (Statement stmt = connection.createStatement()) {
            for (String raw : sql.split(";")) {
                String trimmed = stripFullLineComments(raw).trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }
        }
    }

    /** Remove lines that are only SQL comments (-- …). Keeps inline trailing comments on same line as DDL. */
    private static String stripFullLineComments(String chunk) {
        return Arrays.stream(chunk.split("\n"))
            .filter(line -> !line.trim().startsWith("--"))
            .collect(Collectors.joining("\n"));
    }

    /**
     * Returns the active connection.
     * Thread-safety note: for desktop use single-user, this is fine.
     * For multi-threaded scenarios, use a connection pool.
     */
    public Connection getConnection() {
        try {
            if (connection == null || connection.isClosed()) {
                connection = DriverManager.getConnection(DB_URL);
            }
            return connection;
        } catch (Exception e) {
            throw new RuntimeException("Cannot get DB connection", e);
        }
    }

    public void shutdown() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                log.info("Database connection closed");
            }
        } catch (Exception e) {
            log.error("Error closing DB connection", e);
        }
    }
}
