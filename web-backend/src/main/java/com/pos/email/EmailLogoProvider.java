package com.pos.email;

import com.pos.util.LogUtil;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Component
public class EmailLogoProvider {

    private static final String LOGO_PATH = "email/assets/logo.svg";
    private volatile String cachedDataUri;

    public String logoDataUri() {
        if (cachedDataUri != null) {
            return cachedDataUri;
        }
        synchronized (this) {
            if (cachedDataUri != null) {
                return cachedDataUri;
            }
            try (InputStream in = new ClassPathResource(LOGO_PATH).getInputStream()) {
                byte[] bytes = in.readAllBytes();
                cachedDataUri = "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(bytes);
            } catch (IOException ex) {
                LogUtil.warn(EmailLogoProvider.class, "Email logo not found, using fallback");
                cachedDataUri = "";
            }
            return cachedDataUri;
        }
    }
}
