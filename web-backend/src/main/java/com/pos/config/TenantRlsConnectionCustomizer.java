package com.pos.config;

import com.pos.security.TenantContext;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Устанавливает session variables для PostgreSQL RLS перед каждым запросом в транзакции.
 */
@Component
public class TenantRlsConnectionCustomizer {

    public void apply(Connection connection) throws SQLException {
        Integer companyId = TenantContext.companyId().orElse(null);
        boolean bypass = TenantContext.bypassRls();
        try (Statement st = connection.createStatement()) {
            if (bypass) {
                st.execute("SET LOCAL app.bypass_rls = 'true'");
            } else {
                st.execute("SET LOCAL app.bypass_rls = 'false'");
            }
            if (companyId != null) {
                st.execute("SET LOCAL app.company_id = '" + companyId + "'");
            } else {
                st.execute("SET LOCAL app.company_id = ''");
            }
        }
    }
}
